# preload 路径为什么必须是绝对路径？打包后 __dirname 指到哪？

## 考察点

- `webPreferences.preload` 的解析方式
- 开发相对路径在打包后失效

## 参考答案

### 1. 不要写相对路径

```js
// 不可靠：相对的是当前工作目录，双击安装包时 cwd 不是项目目录
preload: './preload.js',

// 可靠
preload: path.join(__dirname, 'preload.js'),
```

Electron 要求 preload 是绝对路径。相对路径有时在 `electron .` 且 cwd 正确时能跑，换快捷方式、换系统服务启动就找不到。找不到的表现不是主进程崩溃，而是页面里 `window.api` 为空。

### 2. 打包后 __dirname 在哪

主进程打进 asar 时，`__dirname` 类似：

```
/Applications/MyAgent.app/Contents/Resources/app.asar/dist/main
```

`path.join(__dirname, '../preload/preload.js')` 可以指向 asar 内的 preload。Electron 能读 asar 里的 js，preload **不需要** unpack。

前提是构建产物真的把 preload 打进了这个相对位置。多入口打包时，主进程 bundle 和 preload bundle 的目录要和这段 `../preload` 一致。用 `npx asar list app.asar` 核对。

### 3. ESM

主进程是 ESM 时没有 `__dirname`：

```js
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const preload = path.join(dirname, '../preload/preload.js');
```

### 4. 额外检查

启动后如果桥不存在，主进程日志里会有 preload 加载失败。把 preload 路径打进启动日志，比在页面里猜更快。

Windows 路径不要手写反斜杠拼接。只用 `path.join`。

## 面试话术

> preload 必须是绝对路径，用 path.join(__dirname, ...)，不依赖 cwd。打包后 __dirname 在 app.asar 里面，js 形式的 preload 可以留在 asar 里，不必 unpack。路径要和构建产物的相对位置一致，否则窗口能开、window.api 却没有。ESM 用 import.meta.url 换目录。

## 常见追问

- **sandbox 和路径有关系吗？** 没有。路径错误是找不到文件。sandbox 错误是文件找到了但里面 require 了 fs。
- **每个窗口路径不同怎么办？** 每个 BrowserWindow 的 webPreferences.preload 各写各的绝对路径，公共代码在构建时打进对应文件。

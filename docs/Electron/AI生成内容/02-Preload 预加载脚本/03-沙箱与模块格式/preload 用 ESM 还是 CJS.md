# preload 脚本用 ESM 还是 CJS？.mjs preload 有什么限制？

## 考察点

- ESM preload 的支持现状与限制条件
- 工程上的模块格式选型

## 参考答案

### 1. 现状（Electron 28+）

Electron 28 开始支持 ESM，包括 ESM preload，但有**硬性前提**：

| 条件 | 说明 |
|------|------|
| 文件后缀 | `.mjs`（或 package.json `"type": "module"` 下的 .js） |
| **sandbox 必须为 false** | 沙箱内的阉割 require 体系不支持 ESM 加载 |
| 不支持 `require` | ESM preload 里只能用 import，没有 require/module.exports |
| 动态 import 限制 | 部分场景下 import() 有路径限制 |

```js
// preload.mjs（ESM）
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
});
```

```js
// 主进程引用
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.mjs'),
    sandbox: false, // ESM preload 的必要条件
  },
});
```

### 2. ESM vs CJS 对比

| | CJS preload | ESM preload |
|---|---|---|
| sandbox 兼容 | ✅ 可以 sandbox: true | ❌ 必须 sandbox: false |
| 安全性 | 可以达成最严配置 | 牺牲了 OS 沙箱 |
| 与现代工具链契合 | 需要打包转译 | 原生契合（vite 等） |
| 生态成熟度 | 久经考验 | 较新，边角坑多 |

### 3. 工程选型建议

**安全优先的项目：CJS**
```
理由：sandbox: true 的价值 >> ESM 的语法愉悦
做法：源码可以用 TS/ESM 写，构建产物编译成 CJS preload
工具：electron-vite / webpack 都支持把 ESM 源码打包成 CJS preload
```

**工具链优先的项目（electron-vite 默认）：ESM**
```
electron-vite 默认输出 .mjs preload
接受 sandbox: false 的代价
此时更要严格守住 contextBridge 白名单（少了一道 OS 沙箱防线）
```

### 4. 混合项目的注意点

- 主进程 ESM 化与 preload ESM 化是**独立决策**（主进程 28+ 也支持 ESM，互不影响）
- 主进程用 ESM 后 `__dirname` 不存在，用 `import.meta.url` 转换：

```js
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

- 打包工具配置两套产物格式时容易错乱（preload 标成 esm 但 sandbox 没关 → 白屏），构建配置要显式

### 5. 常见坑

1. **.mjs preload + sandbox: true = 静默失败**：页面起来但 window.api undefined，且错误不明显
2. **ESM preload 里 require 不可用**：一些老代码 `const fs = require('fs')` 直接炸
3. **开发环境与生产产物格式不一致**：vite dev 时用 ESM 跑得好好的，build 后格式变化引发问题——dev/build 都要验证
4. **动态 import 第三方包**：asar 包内 ESM 的动态 import 解析有坑，npm 包尽量静态 import 并打包进 bundle

## 面试话术

> ESM preload 从 Electron 28 支持，但硬性要求 sandbox: false——用 ESM 就是拿 OS 沙箱换工具链体验。我的选型逻辑：安全敏感的项目坚持 CJS preload（源码 ESM 写、产物编译成 CJS），保住 sandbox: true；用 electron-vite 等新栈的项目接受 ESM preload，但要把桥接审查标准提一档补偿。

## 常见追问

- **主进程 ESM 值得升吗？** 新项目可以；老项目迁移成本主要在 __dirname、require 动态加载、json 导入断言这些点。
- **怎么验证 preload 真实运行的格式？** 打日志看 `typeof require`，或构建产物直接看后缀与首行。

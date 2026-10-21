# preload 报错（页面白屏但 DevTools 无错误）如何调试？

## 考察点

- preload 错误的特殊表现（不在页面 DevTools 里）
- 系统化的调试手段

## 参考答案

### 1. 为什么 preload 错误"看不见"

preload 跑在隔离世界，它的异常**不会出现在页面的 Console 面板**——页面开发者看到的只是 `window.api is undefined`，却找不到任何报错。这是 preload 调试最大的迷惑点。

错误实际去向：
- 主进程终端的 stderr（开发时启动 electron 的终端）
- 打包后需要 `ELECTRON_ENABLE_LOGGING` 才能看到

### 2. 调试手段清单

**（1）ELECTRON_ENABLE_LOGGING（最常用）**

```bash
# 启动时加环境变量，渲染进程/preload 的 console 和错误会输出到终端
ELECTRON_ENABLE_LOGGING=1 npm start

# Windows
set ELECTRON_ENABLE_LOGGING=1 && npm start
```

**（2）preload 里主动打日志**

```js
// preload.js
console.log('[preload] start'); // 配合 ELECTRON_ENABLE_LOGGING 可见

try {
  contextBridge.exposeInMainWorld('api', api);
  console.log('[preload] api exposed');
} catch (err) {
  console.error('[preload] expose failed:', err);
}
```

更稳的做法：preload 的日志直接发主进程落盘：

```js
const { ipcRenderer } = require('electron');
// 不依赖页面，preload 自己就能打 IPC 日志
ipcRenderer.send('log:preload', '[preload] loaded');
```

**（3）DevTools 切换到隔离世界调试**

页面 DevTools 的 Console 面板左上角有上下文切换器（默认 "top"）：
- 切到 preload 的 isolated world 后，可以直接在 Console 里访问 preload 的变量、`require('electron')`
- 可以在这里手动执行 preload 的代码验证行为

**（4）给 preload 开独立调试（断点）**

```bash
# 主进程调试
electron --inspect=9229 .

# preload/渲染进程调试：DevTools 打开后，
# 在 Sources 面板能找到 preload 脚本（带 isolated world 标记），可直接下断点
```

**（5）注入成败标记**

preload 最后留一个"成功标记"，页面侧检测：

```js
// preload 末尾
contextBridge.exposeInMainWorld('__preloadReady', true);

// 页面侧兜底检测
if (!window.__preloadReady) {
  // preload 加载失败：显示降级 UI 或上报
  reportError('preload failed');
}
```

### 3. 常见报错类型与原因

| 现象 | 常见原因 |
|------|---------|
| `window.api` undefined 但无报错 | preload 路径错误（打包后路径变了）；ESM preload 遇 sandbox: true 静默失败 |
| `require is not defined` | sandbox: true 下用了 Node 模块；或 ESM preload 里写了 require |
| `An object could not be cloned` | contextBridge 暴露了不可克隆对象（ipcRenderer、class 实例） |
| preload 里 import 报错 | 格式/后缀与构建产物不匹配 |
| 开发正常、打包后失效 | 路径用了开发相对路径；preload 文件没打进 asar 或路径解析错误 |

### 4. 打包后 preload 路径问题（最高发）

```js
// ❌ 开发环境能跑、打包后 404
preload: './preload.js'

// ✅ 用 __dirname 绝对路径，且确认构建产物位置
preload: path.join(__dirname, '../preload/preload.js')
```

排查套路：打包后解包 asar 确认 preload 文件存在、路径与代码引用一致：

```bash
npx asar list app.asar | grep preload
```

### 5. 预防性工程实践

1. preload 顶层包 try/catch，异常主动上报主进程（不要静默失败）
2. 注入完成标记 + 页面侧检测兜底
3. CI 里加冒烟测试：启动应用检查 `window.__preloadReady === true`（Playwright 一条 expect）
4. preload 保持精简——逻辑越少，出错面越小

## 面试话术

> preload 错误的迷惑性在于不进页面 Console，实际去向是主进程 stderr。调试三板斧：ELECTRON_ENABLE_LOGGING 看终端、DevTools 上下文切到隔离世界手动验证、preload 注入完成标记 + 页面侧检测兜底。最高发的根因是打包后路径错误和 ESM/sandbox 冲突，CI 加一条 window.__preloadReady 冒烟断言能拦住大部分回归。

## 常见追问

- **sourcemap 对 preload 有效吗？** 有效（构建时生成并在 DevTools 加载），但打包发布版本建议 sourcemap 不上线，排查看混淆后代码配合本地 sourcemap 还原。
- **页面加载很慢，怀疑是 preload 卡住了怎么确认？** preload 首尾打时间戳日志；顶层同步代码是阻塞页面加载的，重活必须异步。

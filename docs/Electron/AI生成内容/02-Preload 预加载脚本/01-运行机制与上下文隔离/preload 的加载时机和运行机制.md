# preload 的加载时机和运行机制？它与页面上下文是什么关系？

## 考察点

- preload 的执行时机与生命周期
- preload 上下文 vs 页面上下文的本质关系

## 参考答案

### 1. 加载时机

preload 脚本在**页面加载之前、渲染进程创建之后**执行：

```
渲染进程创建
  → preload 脚本执行（此时 window/document 已存在但页面 JS 未执行）
  → 页面 HTML/JS 开始加载执行
```

关键特性：
- preload 运行时 **DOM 已可用**（document 对象存在），但页面自己的脚本还没跑
- 所以 preload 能在"页面脚本执行前"注入 API、拦截/增强页面行为
- 每次页面加载（刷新、跳转）preload 都会重新执行

### 2. 运行机制：与页面上下文的关系

取决于 `contextIsolation`（现代默认 true）：

```
contextIsolation: true（推荐）
┌─────────────────────────────────┐
│ 渲染进程                         │
│  ┌──────────┐   ┌───────────┐  │
│  │ 主世界    │   │ 隔离世界   │  │
│  │ (页面 JS) │   │ (preload) │  │
│  │          │   │           │  │
│  │ window.A │ ✗ │ window.B  │  │  ← JS 全局对象互不可见
│  └────┬─────┘   └─────┬─────┘  │
│       └──── 同一个 DOM ────┘    │  ← DOM 共享
└─────────────────────────────────┘
```

- **JS 全局对象隔离**：页面定义 `window.foo`，preload 访问不到；preload 定义的全局，页面也访问不到
- **DOM 共享**：两个 world 操作同一个 document，preload 里 `document.querySelector` 拿到的就是页面的 DOM
- 这正是 Chrome 扩展 content script 的隔离模型（isolated world）

### 3. preload 的能力边界

| 配置 | preload 能用什么 |
|------|----------------|
| `sandbox: false` | 完整 Node.js（fs、child_process…）+ electron 模块 |
| `sandbox: true`（默认） | 阉割版 require：仅 `electron`（ipcRenderer/contextBridge/webFrame）、`events`、`timers`、`url` 等少数模块 |

无论哪种，preload 都可以通过 `require('electron').ipcRenderer` 与主进程通信——这是它作为"桥"的根本。

### 4. 实际用途

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 1. 注入白名单 API（最核心用途）
contextBridge.exposeInMainWorld('api', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
});

// 2. DOM 操作（共享 DOM 的能力）
window.addEventListener('DOMContentLoaded', () => {
  // 注入自定义样式、替换元素等
  document.body.classList.add('electron-app');
});

// 3. 页面环境标记
process.once('loaded', () => {
  // 页面加载前的初始化
});
```

### 5. 常见追问点

**Q：preload 是同步执行完才加载页面吗？**
是的，preload 顶层代码同步执行完后页面才开始加载。所以 preload 里**不要做耗时的同步操作**（会拖慢页面加载）。异步操作不阻塞页面加载，但要注意时序（页面脚本可能比 preload 的异步回调先跑）。

**Q：preload 里能 import npm 包吗？**
sandbox: false 时可以（打包工具会处理）；sandbox: true 时受限。实践上 preload 尽量精简，重逻辑放主进程。

**Q：一个 webContents 能有多个 preload 吗？**
一个 webPreferences 只能指定一个 preload；需要组合时打包成一个文件。但 session 可以给 webview 等指定不同 preload。

## 面试话术

> preload 在渲染进程创建后、页面脚本执行前运行，可访问 DOM 但默认处于隔离世界（与页面 JS 全局对象互不可见、共享 DOM），通过 contextBridge 向页面暴露白名单 API 是它的核心职责。sandbox 开关决定它有无完整 Node 能力。

## 常见追问

- **preload 执行报错会怎样？** 页面正常加载但桥接 API 缺失（`window.api` undefined），错误输出到主进程控制台/终端，不在页面 DevTools 里。
- **HMR 开发时 preload 改了会热更新吗？** 不会自动，需要刷新页面（preload 随页面加载重新执行），electron-vite 等工具会自动处理。

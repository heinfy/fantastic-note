# Electron 的进程模型是怎样的？为什么主进程只有一个？渲染进程崩溃会影响主进程吗？

## 考察点

- 对 Chromium 多进程架构的理解
- 主进程/渲染进程/工具进程的职责划分
- 进程隔离与稳定性

## 参考答案

Electron 沿用了 Chromium 的多进程架构，主要有三类进程：

### 1. 主进程（Main Process）
- **有且仅有一个**，是应用入口（`package.json` 的 `main` 字段指向的文件）
- 运行在 Node.js 环境，同时拥有 Electron 提供的系统 API（窗口、托盘、菜单、系统对话框等）
- 职责：创建/销毁渲染进程、应用生命周期管理、所有系统级能力的唯一入口
- 本质对应 Chromium 架构中的 **Browser 进程**，负责协调全局，所以天然只能有一个

### 2. 渲染进程（Renderer Process）
- 每个 `webContents`（BrowserWindow / webview / WebContentsView）对应一个渲染进程
- 基于 Chromium 渲染环境，默认启用 **Site Isolation**（同站页面可能复用进程）
- 数量随窗口动态创建和销毁

### 3. 工具进程（Utility Process）
- `utilityProcess.fork()` 创建，纯 Node.js 环境、无 UI
- 适合跑重计算、数据处理，避免阻塞主进程
- 此外还有 Chromium 内部的 GPU 进程、网络服务进程等

### 渲染进程崩溃会影响主进程吗？

**不会。** 进程间通过操作系统级隔离：
- 渲染进程崩溃后，主进程会收到 `webContents` 的 `render-process-gone` 事件，可选择重载或提示用户
- 主进程自己崩溃则整个应用退出（所以主进程要异常兜底，见「主进程异常捕获与崩溃守护」）

## 常见追问

- **主进程为什么不能太忙？** 所有渲染进程的 IPC、系统事件都要经过它，主进程阻塞会拖累整个应用的响应。
- **渲染进程之间能直接通信吗？** 默认不行，需要主进程中转或用 `MessagePort` 建立直连通道。

## 加分项

主动提到 Site Isolation、`utilityProcess` 的使用场景，以及"重任务不放主进程"的工程实践，会明显拉开与初中级候选人的差距。

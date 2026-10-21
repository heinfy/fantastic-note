# Electron 是什么

Electron 是用 JavaScript、HTML、CSS 做桌面应用的框架。安装包里带有一份 Chromium 和一份 Node.js，所以同一套代码可以在 Windows、macOS、Linux 上运行，不需要为每个系统写一套原生界面。

官方文档把这件事概括成：把 Chromium 和 Node.js 嵌进同一个可执行文件。应用的界面由 Chromium 渲染，系统能力（文件、窗口、菜单、托盘）由主进程里的 Node 和 Electron API 提供。

## 运行时里有什么

一个 Electron 版本同时锁定三份运行时，可以用下面的值查看：

```js
process.versions.electron;
process.versions.chrome;
process.versions.node;
```

- Chromium 决定页面能用哪些 Web API，也决定 DevTools、GPU 和网络安全策略。
- Node.js 决定主进程能用哪些内置模块，以及原生扩展的 ABI。
- Electron 自己的 API 提供窗口、菜单、托盘、IPC 等桌面能力。

用户电脑上安装的 Chrome 版本，和这个应用里的 Chromium 没有关系。

## 最小结构

官方快速开始示例只有三个文件：

- `main.js`：主进程入口，等 `app.whenReady()` 之后创建窗口。
- `preload.js`：页面脚本执行前运行，用来暴露有限的 API。
- `index.html`：渲染进程里的界面。

`package.json` 的 `main` 字段指向主进程入口。窗口要在 `ready` 之后创建。

## 和浏览器页面的差别

页面仍然是 Chromium 页面，CSS 和 Web API 与同版本 Chrome 一致。差别是能力从哪来：读文件、开系统对话框、注册全局快捷键，都要经过主进程。渲染进程默认不直接拥有 Node.js。

## 相关文档

- [概念-进程模型](./概念-进程模型.md)
- [API-app](./API-app.md)
- [API-BrowserWindow](./API-BrowserWindow.md)

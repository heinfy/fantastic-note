# webContents

`webContents` 表示一份网页，是 `BrowserWindow` 或 `WebContentsView` 里真正加载和执行页面的对象。渲染进程事件、导航、IPC 推送、打印都在这里。

文档：[https://www.electronjs.org/docs/latest/api/webcontents](https://www.electronjs.org/docs/latest/api/webcontents)

## 加载和导航

```js
win.webContents.loadURL('https://example.com');
win.webContents.on('did-finish-load', () => {
  win.webContents.send('ready', { version: app.getVersion() });
});
```

常用事件：

| 事件 | 含义 |
|------|------|
| `did-start-loading` / `did-finish-load` / `did-fail-load` | 加载过程 |
| `dom-ready` | DOM 可用 |
| `will-navigate` | 即将在本窗口跳转，可以阻止 |
| `render-process-gone` | 渲染进程退出或崩溃 |
| `unresponsive` / `responsive` | 页面长时间没有响应，以及恢复 |
| `before-input-event` | 按键送到页面前 |

`setWindowOpenHandler` 决定 `window.open` 和新标签是允许打开，还是改用系统浏览器。

## 和页面通信

```js
win.webContents.send('task:progress', { percent: 40 });
```

页面还没注册监听时，这条消息不会保留。初始化数据可以由页面在加载完成后 `invoke` 来取。

`executeJavaScript` 在页面主世界执行字符串。拼接外部输入会变成脚本注入。给页面数据时用 `send` 传递纯对象。

## 其他能力

- `print` / `printToPDF`：打印和导出 PDF。背景色需要 `printBackground: true`。
- `setZoomFactor`：页面缩放。
- `openDevTools`：开发时打开调试器。`webPreferences.devTools: false` 会禁用它。
- `getProcessMemoryInfo`：该渲染进程的内存。

从 IPC 找回网页所属窗口：`BrowserWindow.fromWebContents(event.sender)`。

## 相关文档

- [概念-进程间通信](./概念-进程间通信.md)
- [术语-ready-to-show](./术语-ready-to-show.md)

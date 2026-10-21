# BrowserWindow

`BrowserWindow` 创建一个带网页的操作系统窗口，继承 `BaseWindow`。必须在 `app` 的 `ready` 之后使用。

文档：[https://www.electronjs.org/docs/latest/api/browser-window](https://www.electronjs.org/docs/latest/api/browser-window)

## 创建

```js
const win = new BrowserWindow({
  width: 960,
  height: 640,
  show: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

win.loadFile('index.html');
win.once('ready-to-show', () => win.show());
```

`webPreferences.session` 和 `partition` 二选一即可。两者都写时，以 `session` 为准。`partition` 以 `persist:` 开头时，数据会保存到磁盘。

## 常用实例方法

| 方法 | 作用 |
|------|------|
| `loadFile` / `loadURL` | 加载页面 |
| `show` / `hide` / `focus` | 显示和聚焦 |
| `minimize` / `maximize` / `unmaximize` | 窗口尺寸状态 |
| `close` / `destroy` | 关闭。`close` 可被 `close` 事件取消 |
| `isDestroyed()` | 窗口是否已经销毁 |
| `setAlwaysOnTop` | 置顶 |
| `getBounds` / `getNormalBounds` | 读取位置和大小。保存窗口状态时用 `getNormalBounds`，避免把最大化尺寸存下来 |

`win.webContents` 是只读的，加载进度、IPC 和打印都走它。

## 静态方法

- `BrowserWindow.getAllWindows()`
- `BrowserWindow.getFocusedWindow()`
- `BrowserWindow.fromWebContents(webContents)`：从 IPC 的 `event.sender` 找回窗口
- `BrowserWindow.fromBrowserView` 已废弃

## 父子窗口

`parent` 让子窗口跟随父窗口最小化和关闭。`modal: true` 时，父窗口在子窗口关闭前不能操作。Linux 上模态行为依赖桌面环境。

## 相关文档

- [概念-窗口与 WebContents](./概念-窗口与%20WebContents.md)
- [API-webContents](./API-webContents.md)
- [术语-webPreferences](./术语-webPreferences.md)

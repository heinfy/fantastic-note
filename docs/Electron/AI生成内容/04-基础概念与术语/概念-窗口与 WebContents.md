# 窗口与 WebContents

屏幕上的窗口和窗口里的网页是两层对象。

- `BrowserWindow` 是一个操作系统窗口，并且自带一份网页。它继承 `BaseWindow`。
- `BaseWindow` 只是窗口外壳，自己不带默认网页。需要显示内容时，往 `contentView` 里添加 `WebContentsView`。
- `webContents` 是那一份网页：加载 URL、发送 IPC、打开开发者工具、打印，都在这个对象上。

`BrowserView` 曾经用来在窗口里再嵌一块网页，现已废弃，替代类型是 `WebContentsView`。

## 一个窗口一份页面

大多数界面用 `BrowserWindow` 即可：

```js
const win = new BrowserWindow({ width: 800, height: 600 });
win.loadFile('index.html');
```

`win.webContents` 就是这个窗口的网页。

## 一个窗口里多块网页

标签页、侧边栏和内容区来自不同源时，用 `BaseWindow` 加多个 `WebContentsView`，并用 `setBounds` 摆放。每个 view 有自己的 `webContents`，因此也有自己的预加载脚本和权限。

## 加载方式

- `loadFile`：加载本地 HTML，地址是 `file://`。
- `loadURL`：加载 `https://` 或自定义协议。
- 远程页面使用独立的 `webPreferences`，不挂业务预加载脚本。

窗口显示可以先设 `show: false`，在 `ready-to-show` 后再 `show()`，避免用户看到白屏。

## 相关文档

- [API-BrowserWindow](./API-BrowserWindow.md)
- [API-webContents](./API-webContents.md)
- [API-BaseWindow 与 WebContentsView](./API-BaseWindow%20与%20WebContentsView.md)
- [术语-ready-to-show](./术语-ready-to-show.md)

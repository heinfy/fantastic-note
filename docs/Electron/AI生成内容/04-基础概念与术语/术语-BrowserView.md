# BrowserView

`BrowserView` 是一块嵌在 `BrowserWindow` 里的额外网页，位置相对父窗口。官方已把它标记为废弃，替代类是 `WebContentsView`。

旧代码里常见：

```js
const view = new BrowserView();
win.setBrowserView(view);
view.setBounds({ x: 0, y: 40, width: 800, height: 560 });
view.webContents.loadURL('https://example.com');
```

`BrowserWindow.fromBrowserView`、`setBrowserView`、`getBrowserView` 都标了废弃。新代码用 `BaseWindow` 或现有窗口的 `contentView.addChildView(new WebContentsView())`。

一个窗口只需要一个页面时，不必使用 view，直接用 `BrowserWindow` 的 `webContents`。

## 相关文档

- [API-BaseWindow 与 WebContentsView](./API-BaseWindow%20与%20WebContentsView.md)
- [概念-窗口与 WebContents](./概念-窗口与%20WebContents.md)

# BaseWindow 与 WebContentsView

`BaseWindow` 是操作系统窗口，不自带网页。`WebContentsView` 是一块可以放进窗口的网页。官方用它们替代已废弃的 `BrowserView`。

文档：

- [https://www.electronjs.org/docs/latest/api/base-window](https://www.electronjs.org/docs/latest/api/base-window)
- [https://www.electronjs.org/docs/latest/api/web-contents-view](https://www.electronjs.org/docs/latest/api/web-contents-view)

## 示例

```js
const { BaseWindow, WebContentsView } = require('electron');

const win = new BaseWindow({ width: 800, height: 400 });
const view = new WebContentsView({
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});
win.contentView.addChildView(view);
view.setBounds({ x: 0, y: 0, width: 800, height: 400 });
view.webContents.loadURL('https://electronjs.org');
```

一个 `WebContents` 同时只能放在一个 `WebContentsView` 里。创建时也可以把已有的 `webContents` 交进去。

## 和 BrowserWindow 的选择

普通应用一个窗口对应一个界面，继续用 `BrowserWindow`。它继承 `BaseWindow`，并且已经内置了一份 `webContents`。

一个窗口里要并排两块不同来源的网页时，用 `BaseWindow` 加多个 view，自己在窗口 `resize` 时更新 `setBounds`。每个 view 的权限单独配置。远程内容那一块不要设置业务预加载脚本。

这些类不能在业务代码里被继承。官方 FAQ 说明 Electron 内置类不可子类化。

## 相关文档

- [概念-窗口与 WebContents](./概念-窗口与%20WebContents.md)
- [术语-BrowserView](./术语-BrowserView.md)

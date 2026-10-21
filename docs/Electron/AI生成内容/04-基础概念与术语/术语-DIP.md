# DIP

DIP 是设备无关像素（device-independent pixel）。Electron 窗口的 `width`、`height`、`getBounds()` 使用 DIP，不是显示器的物理像素。

`scaleFactor` 为 2 的屏幕上，逻辑宽度 800 会占用大约 1600 个物理像素。把物理像素直接写进 `BrowserWindow` 的 `width`，窗口会比预期大一倍。

`screen` 模块每个 display 的 `bounds`、`workArea` 和 `scaleFactor` 用来做多显示器计算。保存和恢复窗口位置时保存 DIP 矩形，并检查它是否还落在某台显示器的 `workArea` 里。

CSS 像素和窗口的 DIP 在默认缩放下是对齐的。页面再使用 `webContents.setZoomFactor` 之后，CSS 布局像素会变，窗口外框的 DIP 尺寸不变。

## 相关文档

- [API-screen](./API-screen.md)
- [API-BrowserWindow](./API-BrowserWindow.md)

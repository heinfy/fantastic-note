# nativeImage

`nativeImage` 是托盘、Dock、拖拽和通知共用的图片对象。它能装下多种缩放比例，避免在高分屏上变模糊。

文档：[https://www.electronjs.org/docs/latest/api/native-image](https://www.electronjs.org/docs/latest/api/native-image)

## 创建

```js
const { nativeImage } = require('electron');

const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
const empty = icon.isEmpty();
const dataUrl = icon.toDataURL();

const trayIcon = nativeImage.createFromPath(templatePath);
trayIcon.setTemplateImage(true);
```

也可以 `createFromBuffer`、`createFromDataURL`、`createEmpty`。`addRepresentation({ scaleFactor, buffer })` 为一倍图和二倍图各放一份像素。

模板图只保留轮廓，macOS 菜单栏会按深色或浅色给它上色。Windows 托盘不要用模板图模式。

`resize`、`crop` 返回新的 `nativeImage`。托盘和 `desktopCapturer` 的缩略图都是这个类型。把图片经 IPC 发给页面时，用 `toDataURL()` 或 `toPNG()`，因为 `nativeImage` 本身不能直接结构化克隆。

## 相关文档

- [API-Tray](./API-Tray.md)
- [API-clipboard](./API-clipboard.md)

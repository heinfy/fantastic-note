# desktopCapturer

`desktopCapturer` 列出可以采集的屏幕和窗口。在主进程调用 `getSources`。

文档：[https://www.electronjs.org/docs/latest/api/desktop-capturer](https://www.electronjs.org/docs/latest/api/desktop-capturer)

## 列出源

```js
const sources = await desktopCapturer.getSources({
  types: ['screen', 'window'],
  thumbnailSize: { width: 320, height: 180 },
  fetchWindowIcons: false,
});
```

每个源包含 `id`、`name`、`thumbnail`（`nativeImage`）和可选的 `appIcon`。不需要缩略图时把宽或高设为 `0`，可以省掉为每个窗口截图的时间。

## 接到页面的媒体流

页面使用 `navigator.mediaDevices.getDisplayMedia`。主进程用 `session.setDisplayMediaRequestHandler` 把用户选中的源交出去：

```js
session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
  callback({ video: selectedSource });
});
```

## 权限

macOS 10.15 之后采集屏幕需要屏幕录制权限，用 `systemPreferences.getMediaAccessStatus('screen')` 查询。macOS 14.2 起，采集系统音频还要在 `Info.plist` 中加入 `NSAudioCaptureUsageDescription`。Linux 在 PipeWire 下，`getSources` 可能只返回一个合成后的源。

缩略图和画面里会有其他应用的内容。开始采集前给用户明确的界面，结束时停止媒体轨道。

## 相关文档

- [API-systemPreferences](./API-systemPreferences.md)
- [API-session](./API-session.md)

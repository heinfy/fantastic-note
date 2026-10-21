# desktopCapturer 怎么做屏幕采集？权限卡在哪里？

## 考察点

- 采集 API 已经在主进程
- macOS 屏幕录制权限和系统音频是分开的

## 参考答案

### 1. 现在的用法

`desktopCapturer.getSources` 在主进程调用。渲染进程只负责 `getUserMedia` 或 `getDisplayMedia`，源由主进程选定。

```js
const { desktopCapturer, systemPreferences } = require('electron');

ipcMain.handle('capture:sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: false,
  });
  // 只把 id、name、缩略图给页面，不把模块本身暴露出去
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }));
});
```

页面选中某个 id 后，用 `session.setDisplayMediaRequestHandler` 把这个源交给 `getDisplayMedia`：

```js
session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
  // 使用用户刚选中的 source，而不是默默取第一个屏幕
  callback({ video: selectedSource });
});
```

### 2. macOS 权限

- 屏幕内容：需要屏幕录制权限。`systemPreferences.getMediaAccessStatus('screen')` 查询。没有权限时，`getSources` 可能只拿到空窗口或应用自己的窗口
- 系统音频：macOS 14.2 之后还要在 Info.plist 里声明音频采集用途，否则只有画面没有系统声音
- 权限是按签名记的。开发时授给 Electron，正式包要再授一次，授完通常要重启应用

Windows 没有同等的屏幕录制弹窗，但系统设置里仍可能限制后台采集。

### 3. 缩略图的成本

每个窗口都会截一张图。窗口多时把 `thumbnailSize` 调小，或者只要列表不要预览时把宽高设成 0。不要用定时器连续 `getSources`，那是 CPU 和权限检查的双重浪费。

### 4. 安全

采集到的画面是用户桌面，可能包含其他应用的内容。不要自动上传。开始采集前有明确的 UI，结束时停掉 MediaStream 的所有 track。

## 面试话术

> 源列表在主进程用 desktopCapturer.getSources 拿，页面只收到 id 和缩略图。真正开流用 setDisplayMediaRequestHandler 把用户选中的源交出去。macOS 要屏幕录制权限，系统声音是另一条用途声明。开发签名和正式签名的授权不共享。缩略图按需生成，采集内容不自动上传。

## 常见追问

- **和 getUserMedia 共享屏幕的关系？** Chromium 的选择器在 Electron 里经常不可用，所以要自己列源，再用 display media handler 接上。
- **Linux 呢？** Wayland 下经常只能拿到一个合成后的源，和 X11 行为不同，要单独测。

# setPermissionRequestHandler 管哪些权限？怎么按来源拒绝？

## 考察点

- 网页权限请求在 Electron 里默认行为不总是安全的
- 按权限种类和 URL 做白名单

## 参考答案

### 1. 它拦截什么

远程页面调用通知、定位、摄像头、麦克风、MIDI、剪贴板读等 API 时，Chromium 会问宿主答不答应。Electron 里用 session 上的 handler 回答：

```js
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  const url = new URL(webContents.getURL());
  const allowHost = url.origin === 'https://app.example.com';

  // 自己的页面才考虑通知；摄像头仍默认拒绝，除非这个窗口就是会议页
  if (permission === 'notifications' && allowHost) {
    callback(true);
    return;
  }
  callback(false);
});
```

不注册 handler 时，不同版本对默认同意还是拒绝并不值得赌。加载远程内容的 session 应该自己写明拒绝策略。

常见 `permission` 字符串：`media`、`geolocation`、`notifications`、`midi`、`pointerLock`、`fullscreen`、`openExternal`。具体以当前 Electron 版本文档为准。

### 2. 和系统权限不是一层

handler 同意摄像头之后，macOS 仍可能再要一次系统隐私权限。两边都过才真的能采集。handler 拒绝则页面连系统弹窗都到不了。

屏幕采集不走这个“同意网站通知”的同一条路径，见 `desktopCapturer` 和 `setDisplayMediaRequestHandler`。

### 3. 按 session 配

默认 session 一套，给第三方页面用的临时 partition 另一套，并且第三方那套全部 `callback(false)`。不要在默认 session 上对所有 origin 同意 `media`。

`setPermissionCheckHandler` 是另一条：网站查询“我有没有权限”时怎么答。请求和查询两个 handler 都要设，避免页面认为自己有权限、调用时又失败。

## 面试话术

> 远程页面的通知、定位、摄像头请求用 setPermissionRequestHandler 按 origin 和权限种类回答，不依赖默认行为。第三方 session 全部拒绝。这只是网页层的同意，macOS 系统隐私权限还要单独过。查询权限的 check handler 和请求 handler 一起设。

## 常见追问

- **本地 myapp:// 页面需要弹这个吗？** 本地页面的能力尽量走 preload，不要让它用网页权限 API 绕一圈。真要用，origin 白名单写成自己的 scheme。
- **openExternal 也在权限里？** 有的版本会把打开外部链接当成权限请求。即使这里放行了，`shell.openExternal` 里仍要做协议校验。

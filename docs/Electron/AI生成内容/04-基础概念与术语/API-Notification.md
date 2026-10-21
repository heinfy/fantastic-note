# Notification

Electron 的 `Notification` 调用操作系统通知中心。主进程创建的通知在窗口关闭后仍可以显示。

文档：[https://www.electronjs.org/docs/latest/api/notification](https://www.electronjs.org/docs/latest/api/notification)

## 用法

```js
const { Notification } = require('electron');

if (Notification.isSupported()) {
  const notice = new Notification({
    title: '任务完成',
    body: '有 3 项结果可以查看',
  });
  notice.on('click', () => showMainWindow());
  notice.show();
}
```

常用事件是 `show`、`click` 和 `close`。`action`、回复框等能力依赖操作系统，不是每个平台都完整。

## 和网页 Notification 的差别

页面里的 `new window.Notification()` 走网页通知，远程页面还要经过 `session.setPermissionRequestHandler` 里的 `notifications` 权限。后台代理类应用用主进程这份 API，不依赖页面仍在前台。

## 平台

- Windows 需要应用用户模型 ID（AppUserModelID），安装包工具通常会写上。缺少它时，通知可能不出现。
- macOS 还受系统通知开关和专注模式影响。开发时的签名和正式包的签名是两条授权记录。
- 通知正文会出现在锁屏上。验证码和隐私内容留在应用内，通知只写“有一条新消息”。

角标不是这个模块的功能。macOS 用 `app.dock.setBadge`，Windows 任务栏闪烁用 `win.flashFrame(true)`。

## 相关文档

- [术语-AppUserModelID](./术语-AppUserModelID.md)
- [API-Tray](./API-Tray.md)

# AppUserModelID

AppUserModelID（AUMID）是 Windows 用来识别一个应用的字符串。任务栏分组、跳转列表和 Toast 通知都靠它把窗口和开始菜单里的快捷方式对应起来。

Electron 里用：

```js
if (process.platform === 'win32') {
  app.setAppUserModelId('com.example.myapp');
}
```

在创建窗口之前设置。electron-builder 的 `appId` 会写进安装信息和快捷方式，运行时的 `setAppUserModelId` 要和它一致。

不一致时的常见现象：

- 通知发出去了，但点击后系统找不到你的程序
- 任务栏上出现两个图标，一个是安装后的快捷方式，一个是正在运行的进程
- 通知完全不显示

macOS 用 bundle id 做对应的事，不使用这个 API。

## 相关文档

- [API-Notification](./API-Notification.md)
- [API-app](./API-app.md)

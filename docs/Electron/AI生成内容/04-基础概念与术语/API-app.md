# app

`app` 是主进程模块，控制应用生命周期、路径、单实例和协议注册。它在 `ready` 之前就可以调用一部分方法，但创建窗口要等 `ready`。

文档：[https://www.electronjs.org/docs/latest/api/app](https://www.electronjs.org/docs/latest/api/app)

## 生命周期

```js
const { app, BrowserWindow } = require('electron');

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
```

`before-quit` 可以 `preventDefault()` 来取消退出。`will-quit` 时窗口已经开始关闭，适合做注销快捷键这类收尾。

## 路径

| 方法 | 作用 |
|------|------|
| `app.getPath(name)` | 取 `userData`、`temp`、`downloads`、`logs`、`exe` 等目录 |
| `app.setPath(name, path)` | 改目录。改 `userData` 要在 `ready` 之前 |
| `app.getAppPath()` | 开发时是项目目录，打包后通常是 `app.asar` |
| `app.isPackaged` | 是否在安装包里运行 |

用户可写的数据放在 `userData`。安装目录在更新时会被覆盖。

## 其他常用方法

- `requestSingleInstanceLock()` / `second-instance`：保证只跑一个实例。
- `setAsDefaultProtocolClient(protocol)`：注册深度链接。
- `setLoginItemSettings({ openAtLogin })`：开机启动。
- `getVersion()`：读应用版本。
- `getAppMetrics()`：各进程的 CPU 和内存。
- `quit()`、`exit(code)`：退出。`exit` 不走完整的退出事件。

## 相关文档

- [概念-应用生命周期](./概念-应用生命周期.md)
- [术语-userData](./术语-userData.md)
- [术语-单实例锁](./术语-单实例锁.md)

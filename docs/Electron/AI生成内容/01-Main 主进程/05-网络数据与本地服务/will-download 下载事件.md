# will-download 和 DownloadItem 能做什么？和自研下载队列怎么分工？

## 考察点

- Chromium 下载链路的钩子
- 什么时候不要重复造轮子

## 参考答案

### 1. 页面或重定向触发的下载

渲染进程点了一个 `Content-Disposition: attachment` 的链接时，Electron 不会弹浏览器的下载栏，而是触发 `will-download`：

```js
session.defaultSession.on('will-download', (event, item, webContents) => {
  const fileName = item.getFilename();
  // 只允许落到用户选过的下载目录，不要用网页建议的绝对路径
  item.setSavePath(path.join(app.getPath('downloads'), path.basename(fileName)));

  item.on('updated', () => {
    const percent = item.getReceivedBytes() / item.getTotalBytes();
    webContents.send('download:progress', { fileName, percent });
  });

  item.on('done', (_e, state) => {
    // state: completed / cancelled / interrupted
    webContents.send('download:done', { fileName, state });
  });
});
```

可以 `event.preventDefault()` 取消这次下载，用来拦掉网页里的意外文件。

### 2. DownloadItem 能做的

- 改保存路径、暂停、恢复、取消
- 读已下字节、总字节、URL、MIME
- 监听完成和中断

它**不负责**你自己用 `net.request` 写的下载。那种要自己做 Range、断点续传和校验。

### 3. 怎么分工

| 场景 | 做法 |
|------|------|
| 网页里点链接、导出接口返回附件 | `will-download` |
| agent 后台拉升级包、要断点续传和校验 | 主进程自研队列 |
| 用户必须先选目录 | 先 `showSaveDialog`，再 `setSavePath` |

保存路径用 `path.basename`，防止响应头里的文件名带 `../`。

## 面试话术

> 页面触发的下载走 session 的 will-download，用 DownloadItem 改路径、报进度、暂停恢复。文件名只取 basename。后台大文件、要断点续传的，不走这条链路，用主进程自己的 Range 下载。两条不要混在一个进度条实现里。

## 常见追问

- **下载完怎么打开？** `shell.showItemInFolder(savePath)` 或 `shell.openPath`。打开前确认 state 是 completed。
- **多个 partition 都要监听吗？** 要。监听挂在 session 上，账号隔离的 session 要各自注册，或者抽一个函数在创建 partition 时调用。

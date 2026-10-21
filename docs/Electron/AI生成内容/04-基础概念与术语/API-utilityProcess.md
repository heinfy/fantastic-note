# utilityProcess

`utilityProcess.fork` 启动一个带 Node.js 的子进程，通信可以使用消息端口。它对应 Node 的 `child_process.fork`，但由 Chromium 的 Services API 拉起。

文档：[https://www.electronjs.org/docs/latest/api/utility-process](https://www.electronjs.org/docs/latest/api/utility-process)

## 启动

```js
const { utilityProcess } = require('electron');

const child = utilityProcess.fork(path.join(__dirname, 'worker.js'), [], {
  serviceName: 'hash-worker',
});

child.on('spawn', () => child.postMessage({ file: filePath }));
child.on('message', (message) => console.log(message));
```

子进程脚本里用 `process.parentPort` 接收和发送消息。这个进程没有 `BrowserWindow` 和 `ipcMain`。

## 选项里值得知道的字段

| 选项 | 作用 |
|------|------|
| `serviceName` | 出现在 `app.getAppMetrics()` 和 `child-process-gone` 里的名字 |
| `session` | 让子进程的网络请求使用这份 session 的缓存和代理。默认使用没有 HTTP 缓存的系统网络上下文 |
| `respondToAuthRequestsFromMainProcess` | 为 `true` 且提供了 `session` 时，401/407 认证交到子进程的 `login` 事件；未提供 session 时交到 `app` 的 `login` |

父进程退出时，utility 进程一并退出。适合哈希、压缩、扫描这类不能堵住主进程的工作。启动外部 exe 仍然用 `child_process.spawn`。

## 相关文档

- [概念-进程模型](./概念-进程模型.md)
- [API-MessageChannelMain](./API-MessageChannelMain.md)
- [术语-ABI 与原生模块](./术语-ABI%20与原生模块.md)

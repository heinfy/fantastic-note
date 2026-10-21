# ipcMain

`ipcMain` 在主进程接收渲染进程发来的消息。它是 `EventEmitter`。频道名是字符串，由应用自己约定。

文档：[https://www.electronjs.org/docs/latest/api/ipc-main](https://www.electronjs.org/docs/latest/api/ipc-main)

## 两种注册方式

```js
const { ipcMain } = require('electron');

ipcMain.on('log:write', (event, line) => {
  console.log(line);
});

ipcMain.handle('user:get', async (event, id) => {
  return { id, name: 'Ada' };
});
```

| 方法 | 配对的渲染进程 API | 结果 |
|------|--------------------|------|
| `on` | `send` | 不返回值。要用 `event.reply` 或 `event.returnValue` |
| `handle` | `invoke` | `return` 的值或抛出的错误会回到 Promise |
| `handleOnce` | `invoke` | 只处理一次 |
| `removeHandler` | — | 取消 `handle`，同一频道才能再次注册 |

`handle` 的回调可以是 `async`。同一频道注册第二个 `handle` 会抛出 “second handler” 错误。

## event 上有什么

- `event.sender`：发送方的 `webContents`。
- `event.senderFrame`：发送方的框架，可以用它的 URL 确认消息来自自己的页面。
- `event.reply(channel, ...args)`：沿原路回复，用于 `send` 模式。

窗口身份从 `event.sender` 查找，不从参数里接收一个窗口 id。

## 相关文档

- [API-ipcRenderer](./API-ipcRenderer.md)
- [概念-进程间通信](./概念-进程间通信.md)

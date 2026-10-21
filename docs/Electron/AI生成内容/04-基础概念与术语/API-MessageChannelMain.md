# MessageChannelMain

`MessageChannelMain` 在主进程创建一对相连的消息端口。把端口转交给渲染进程或 utility 进程之后，两端直接通信，后续消息不再经过 `ipcMain`。

文档：[https://www.electronjs.org/docs/latest/api/message-channel-main](https://www.electronjs.org/docs/latest/api/message-channel-main)

## 建立通道

```js
const { MessageChannelMain } = require('electron');

const { port1, port2 } = new MessageChannelMain();
winA.webContents.postMessage('port', null, [port1]);
winB.webContents.postMessage('port', null, [port2]);
```

预加载脚本里：

```js
ipcRenderer.on('port', (event) => {
  const port = event.ports[0];
  port.onmessage = (messageEvent) => console.log(messageEvent.data);
  port.postMessage({ hello: 'world' });
  port.start();
});
```

端口在 `postMessage` 的第三个参数里被转移。转交之后，原来的一侧不能再使用它。

## 适合的数据

端口上的数据仍然要能结构化克隆。两端固定、消息很频繁时，用它避免主进程转发每一条。控制类的低频请求继续用 `invoke`，代码更直接。

一端进程退出后，另一端再发的消息不会送达。需要时在业务层加重连：主进程重新 `fork` 或重新创建通道，再把新端口交出去。

## 相关文档

- [概念-进程间通信](./概念-进程间通信.md)
- [API-utilityProcess](./API-utilityProcess.md)
- [术语-结构化克隆](./术语-结构化克隆.md)

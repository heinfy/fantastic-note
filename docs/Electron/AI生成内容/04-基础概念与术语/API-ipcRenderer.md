# ipcRenderer

`ipcRenderer` 在渲染进程里使用，通常只出现在预加载脚本中。页面通过 `contextBridge` 调用包装函数，而不是直接拿到这个模块。

文档：[https://www.electronjs.org/docs/latest/api/ipc-renderer](https://www.electronjs.org/docs/latest/api/ipc-renderer)

## 方法

```js
const { ipcRenderer } = require('electron');

ipcRenderer.send('log:write', 'hello');

const user = await ipcRenderer.invoke('user:get', 'u1');

ipcRenderer.on('task:progress', (_event, payload) => {
  console.log(payload.percent);
});
```

| 方法 | 行为 |
|------|------|
| `send(channel, ...args)` | 异步发送，没有返回值 |
| `invoke(channel, ...args)` | 返回 Promise，对应 `ipcMain.handle` |
| `sendSync(channel, ...args)` | 阻塞渲染进程，直到主进程设置 `returnValue` |
| `on` / `once` / `removeListener` | 接收主进程 `webContents.send` |
| `postMessage` | 可以附带转交的 `MessagePort` |

监听器的第一个参数是 `IpcRendererEvent`。经过 `contextBridge` 时只把后面的数据参数交给页面，事件对象留在预加载脚本里。

## 放在哪一层

```js
contextBridge.exposeInMainWorld('api', {
  getUser: (id) => ipcRenderer.invoke('user:get', id),
  onProgress: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
});
```

`sendSync` 会卡住页面。需要结果时用 `invoke`。

## 相关文档

- [API-ipcMain](./API-ipcMain.md)
- [API-contextBridge](./API-contextBridge.md)

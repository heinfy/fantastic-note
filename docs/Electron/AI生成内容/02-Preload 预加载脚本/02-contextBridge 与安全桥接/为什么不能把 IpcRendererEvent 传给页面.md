# 订阅回调为什么不能把 IpcRendererEvent 传给页面？

## 考察点

- contextBridge 只能把可克隆的数据交出去
- 事件对象上挂着发送方，不该进页面

## 参考答案

### 1. 错误写法

```js
contextBridge.exposeInMainWorld('api', {
  onProgress: (callback) => {
    // 把整个 event 交给页面
    ipcRenderer.on('task:progress', callback);
  },
});
```

`ipcRenderer.on` 的第一个参数是 `IpcRendererEvent`。它上面有 `sender`、`ports` 一类内部字段，不是普通 JSON。通过 contextBridge 交给页面时：

- 可能直接克隆失败，订阅看起来“时好时坏”
- 即使拆出一部分字段，也把 IPC 内部对象的形状漏给了页面

页面需要的只是业务数据。

### 2. 正确写法

```js
contextBridge.exposeInMainWorld('api', {
  onProgress: (callback) => {
    const listener = (_event, payload) => {
      // 只把纯数据交给页面回调
      callback({ taskId: payload.taskId, percent: payload.percent });
    };
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
});
```

`_event` 留在 preload 里丢掉。返回取消函数，让页面在组件卸载时解绑，否则每次挂载都多一个监听。

### 3. 主进程发来的对象也要裁剪

不要把数据库整行、本地绝对路径、令牌一起 `send` 再原样 `callback(payload)`。在 preload 或主进程里挑出页面要画的字段。preload 裁剪适合“主进程载荷比 UI 大”，主进程裁剪适合“根本不该离开主进程的字段”。两处都做是浪费，至少有一处做。

## 面试话术

> ipcRenderer.on 的 event 留在 preload，回调只收业务字段。event 克隆不过去，上面也有不该给页面的发送方信息。订阅函数返回 removeListener，避免组件反复挂载把同一条消息处理多次。

## 常见追问

- **页面能不能自己 ipcRenderer.on？** 不能。没有把 ipcRenderer 暴露出去，页面只能调你写好的 onProgress。
- **一次推送要给多个组件用呢？** preload 里仍是一个 listener，在页面里用自己的事件总线转发。不要每个组件各注册一条 IPC。

# ipcMain.on 与 ipcMain.handle 的区别？invoke 的原理是什么？

## 考察点

- 两种 IPC 模式的语义差异
- 对 invoke/handle 底层机制的理解

## 参考答案

### 1. 两种通信模式

| | `send` / `on` | `invoke` / `handle` |
|---|---|---|
| 模型 | 事件订阅（单向） | 请求-响应（Promise 化） |
| 返回值 | 无，需手动回发消息 | 直接 `return`，渲染侧 await 拿到 |
| 注册限制 | 同一 channel 可挂多个监听 | **同一 channel 只能 handle 一次**，重复注册直接抛错 |
| 适用 | 通知、日志、状态上报 | 查询、读写、需要结果的操作 |

```js
// 单向：渲染侧发完就不管
ipcRenderer.send('log', '用户点击了按钮');
ipcMain.on('log', (e, msg) => logger.info(msg));

// 请求-响应：渲染侧等待结果
const user = await ipcRenderer.invoke('user:get', userId);
ipcMain.handle('user:get', async (e, userId) => {
  return await db.getUser(userId); // return 值即响应
});
```

### 2. invoke 的底层原理

`invoke/handle` 并不是新的 IPC 原语，而是**在 send/on 之上的协议封装**：

1. 渲染进程调用 `invoke` 时，内部生成一个唯一的响应 channel（invoke 的 callback id）
2. 把请求参数 send 给主进程，同时挂起 Promise 等待响应
3. 主进程 handler 执行完后，把结果（或错误）通过响应 channel 回传
4. 渲染进程收到后 resolve / reject

因此：
- 返回值和参数一样要经过**结构化克隆**序列化
- handler 抛出的异常会被序列化成 Error 传回渲染侧 reject（但自定义属性会丢失，只剩 message）
- 渲染进程销毁时，pending 的 invoke 会永远悬挂（设计时要考虑超时）

### 3. 主进程回复 send/on 模式的标准做法

如果用了 send/on 又需要回结果，要靠 `event` 对象回发：

```js
ipcMain.on('user:get', async (e, userId) => {
  const user = await db.getUser(userId);
  e.reply('user:get:reply', user); // 手动约定响应 channel
});
```

这正是 invoke/handle 帮你自动化的部分——所以现代代码里**优先 invoke/handle**，send/on 只用于纯通知。

### 4. 注意点

- `handle` 重复注册会抛 `Error: Attempted to register a second handler`，热重载/窗口重建场景要先 `removeHandler`
- `handle` 里 `return` 一个 Promise，框架会自动 await
- 渲染侧 `invoke` 没有内置超时，需要的话自己包一层 `Promise.race`

## 面试话术

> send/on 是事件模型，invoke/handle 是在其上封装的请求-响应协议，内部用唯一 channel 关联请求和响应实现 Promise 化。工程上查询类一律 invoke，通知类才用 send；热重载时注意 removeHandler。

## 常见追问

- **invoke 能传函数作为参数吗？** 不能，结构化克隆不支持函数。需要回调就再开一条 channel 或用 MessagePort。
- **invoke 的错误怎么传？** handler 内 throw，渲染侧 catch 到的是 message 被序列化的 Error，建议自定义错误用 `{ code, message }` 对象返回而不是 throw。
- **`ipcMain.handleOnce` 存在吗？** 存在，还有 `ipcMain.removeHandler` / `removeAllListeners` 用于清理。

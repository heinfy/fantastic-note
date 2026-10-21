# MessageChannelMain / MessagePort 在 Electron 中的使用场景？

## 考察点

- MessagePort 体系的建立流程
- 相比普通 IPC 的优势场景

## 参考答案

### 1. 是什么

`MessageChannelMain` 在主进程创建一对互相连通的端口（port1/port2），通过 `postMessage` 把端口**转移**到任意进程（渲染进程/工具进程），之后两端直接通信，**不再经过主进程中转**。

### 2. 基本用法：两个渲染进程直连

```js
// ===== 主进程：创建通道并分发端口 =====
const { MessageChannelMain } = require('electron');

const { port1, port2 } = new MessageChannelMain();

// 把 port1 交给窗口 A，port2 交给窗口 B
winA.webContents.postMessage('init-port', null, [port1]);
winB.webContents.postMessage('init-port', null, [port2]);

// ===== 窗口 A / B 的 preload：接收端口 =====
ipcRenderer.on('init-port', (e) => {
  const port = e.ports[0]; // 拿到 MessagePort
  // 之后直接双向通信，不经过主进程
  port.onmessage = (event) => console.log('收到:', event.data);
  port.postMessage({ hello: 'world' });
  port.start(); // 注意：onmessage 赋值后需要 start
});
```

### 3. 典型场景

**（1）渲染进程 ↔ 渲染进程高频通信**
- 数据采集窗口 → 实时图表窗口，每秒几十上百条数据
- 普通方案：A → 主进程 → B，每条消息主进程都参与序列化/转发
- MessagePort：主进程只牵线一次，之后零负担

**（2）渲染进程 ↔ utilityProcess（工具进程）**

```js
// 主进程
const child = utilityProcess.fork('./heavy-task.js');
const { port1, port2 } = new MessageChannelMain();
child.postMessage(null, [port1]);        // 给工具进程
mainWin.webContents.postMessage('worker-port', null, [port2]); // 给渲染进程
```

渲染进程直接和重计算进程通信：发任务、收进度、收结果流——主进程完全解放。

**（3）流式/ chunked 数据传输**
大数据分块通过 port 持续推送，接收方流式处理，避免一次性克隆大对象。

### 4. 注意点

1. **端口只能转移一次**：postMessage 把 port 转出去后，原进程就失去它
2. **端口也是消息队列**：消息同样走结构化克隆（只是不经过主进程），大对象优化仍要靠 ArrayBuffer transfer
3. **配对生命周期**：一端进程销毁，另一端发消息会丢失，需要有心跳或重连协议
4. `e.ports[0]` 拿到后要 `port.start()`（或直接用 onmessage，隐式 start）

### 5. 与普通 IPC 的对比

| | send/invoke | MessagePort |
|---|---|---|
| 拓扑 | 星型，主进程为中心 | 点对点直连 |
| 主进程负担 | 每条消息都参与 | 仅建立通道时参与 |
| 通道数 | channel 字符串任意 | 需显式创建/分发 |
| 适合 | 低频控制、请求响应 | 高频数据流、固定链路 |

## 面试话术

> MessageChannelMain 解决的是"主进程成为通信瓶颈"的问题：主进程只做一次端口分发，之后两端直连。我在 agent 里用它连接渲染进程和 utility process，实时传输采集数据流，主进程 CPU 占用几乎降为零。

## 常见追问

- **端口能存在主进程吗？** 可以，留一个 port 在主进程就是一条"不挤占 ipcMain 事件循环队列"的专用通道。
- **和 BroadcastChannel 的区别？** BroadcastChannel 是渲染进程间同源广播，无定向、无主进程参与建立；MessagePort 是点对点，可跨进程任意拓扑。

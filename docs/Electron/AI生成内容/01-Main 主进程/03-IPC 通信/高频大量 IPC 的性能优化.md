# 高频、大数据量的 IPC 通信有哪些性能问题？如何优化？

## 考察点

- IPC 的开销来源（结构化克隆）
- 多种优化手段的适用场景

## 参考答案

### 1. 性能瓶颈在哪

IPC 消息传递要经过：**JS 对象 → 结构化克隆序列化 → 进程间管道传输 → 反序列化**。开销主要来自：

- **序列化/反序列化**：大对象（如几 MB 的数组）结构化克隆耗时随体积线性增长，且阻塞双方 JS 主线程
- **消息频率**：高频小消息（如每帧一次）的固定开销累积
- **主进程瓶颈**：所有渲染进程的 IPC 都经过主进程，它忙则全卡

### 2. 优化手段（按推荐顺序）

**（1）减少传输：能不传就不传**
- 大数据不通过 IPC 搬运：主进程写临时文件/内存数据库，渲染进程只拿 id 或分页拉取
- 大文件场景让渲染进程通过自定义协议或本地 HTTP 服务读取，IPC 只传元信息

**（2）降低频率：合并与节流**
```js
// 高频事件聚合成批次发送
let buffer = [];
const flush = throttle(() => {
  if (buffer.length) {
    win.webContents.send('log:batch', buffer);
    buffer = [];
  }
}, 200); // 每 200ms 最多发一次

function pushLog(log) {
  buffer.push(log);
  flush();
}
```

**（3）二进制零拷贝：ArrayBuffer 转移**
结构化克隆对 ArrayBuffer 支持 **transfer**（所有权转移，不发生拷贝）：

```js
// 主进程：transfer 后本侧 buffer 失效，但零拷贝
win.webContents.postMessage('binary', data, [data.buffer]);
```

**（4）绕过主进程：MessagePort 直连**
两个渲染进程间高频通信（如数据窗口 → 图表窗口），建立 MessageChannel 直连，主进程只做一次"牵线"。

**（5）共享内存：SharedArrayBuffer**
多进程间共享同一块内存，配合 Atomics 做同步，彻底免序列化。但：
- 需要跨域隔离响应头（COOP/COEP），自定义协议下要手动配
- 复杂度高，只在对延迟极端敏感的场景（音视频、实时渲染）使用

**（6）换通道：本地 HTTP/WebSocket 服务**
agent 已有本地服务时，大吞吐量数据直接走本地 HTTP（流式），Chromium 网络栈比 IPC 管道更适合流式大数据。

### 3. 一个量化参考

结构化克隆 1MB 普通对象大约毫秒级，但 100MB 级数据或每秒上千条消息就会明显卡顿——此时必须上 transfer / MessagePort / 换通道，而不是调参。

### 4. 排查方法

- Performance 面板观察主进程/渲染进程的长任务
- 给 IPC 封装层加耗时埋点（序列化前后打 size + 时间戳）
- 主进程 `process.memoryInfo` 观察是否有大量序列化导致的内存抖动

## 面试话术

> 先定性：瓶颈在结构化克隆和主进程单点。优化按层次来——能不走 IPC 的用文件/本地服务；必须走的合并降频；二进制用 transfer 零拷贝；高频通道用 MessagePort 直连；极端场景 SharedArrayBuffer。原则是 IPC 传"引用和控制"，不传"数据本体"。

## 常见追问

- **postMessage 和 send 区别？** postMessage 支持 transfer 列表，且是 MessagePort 体系的 API；send 只是简单封装。
- **传 ArrayBuffer 一定比对象快吗？** 序列化开销小，但渲染侧拿到后还要转成可用结构（如解码），综合评估。

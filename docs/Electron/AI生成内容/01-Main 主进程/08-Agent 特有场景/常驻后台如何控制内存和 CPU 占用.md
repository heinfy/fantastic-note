# 常驻后台的 agent 如何控制内存和 CPU 占用？

## 考察点

- 7x24 常驻应用的资源治理
- 主进程阻塞排查与任务隔离

## 参考答案

### 1. 资源占用的主要来源

| 来源 | 表现 |
|------|------|
| 定时器泛滥 | 多个 setInterval 各自醒，CPU 无法休眠 |
| 渲染进程空转 | 隐藏窗口仍在渲染/rAF/定时器 |
| 数据无界增长 | 日志 buffer、消息队列、缓存只进不出 |
| 主进程重计算 | 大数据处理阻塞事件循环 |
| 句柄泄漏 | 监听器、socket、文件句柄不释放 |

### 2. CPU 治理

**（1）定时器合并与对齐**

```js
// ❌ 各模块各自 setInterval，唤醒点散乱
setInterval(reportHeartbeat, 30_000);
setInterval(syncConfig, 33_000);
setInterval(cleanCache, 60_000);

// ✅ 统一调度器：单一 tick，任务按周期对齐触发
class Scheduler {
  constructor() {
    this.tasks = [];
    // 单一 tick，周期取所有任务的最大公约数
    setInterval(() => this.tick(), 5000);
  }
  add(name, intervalMs, fn) {
    this.tasks.push({ name, intervalMs, fn, lastRun: 0 });
  }
  tick() {
    const now = Date.now();
    for (const t of this.tasks) {
      if (now - t.lastRun >= t.intervalMs) {
        t.lastRun = now;
        t.fn(); // 到点才执行
      }
    }
  }
}
```

**（2）重任务移出主进程**

```js
// utilityProcess 跑重计算，主进程只做调度
const { utilityProcess } = require('electron');
const worker = utilityProcess.fork('./hash-worker.js');
worker.postMessage({ file: largeFilePath });
worker.on('message', (result) => { /* 拿结果 */ });
```

**（3）隐藏窗口的渲染降耗**
- 窗口隐藏时 Chromium 默认 backgroundThrottling（降到 1fps），**保持开启**，不要图省事关掉
- 页面里用 `document.visibilitychange` 感知隐藏，暂停非必要动画/轮询
- 纯后台 agent 可以**不创建任何窗口**，设置界面按需创建

### 3. 内存治理

**（1）一切 buffer 必须有界**

```js
// 环形缓冲：日志内存队列最多 1000 条
class RingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = [];
  }
  push(item) {
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift(); // 淘汰最旧
  }
}
```

**（2）窗口用完即销毁**
```js
const win = new BrowserWindow({ ... });
win.on('closed', () => {
  // closed 后释放所有引用，渲染进程被回收
});
// 不要长期持有不用的隐藏窗口——每个渲染进程都是几十上百 MB
```

**（3）监控与告警**

```js
// 定期自检主进程内存
setInterval(() => {
  const mem = process.memoryInfo(); // Electron 的 API，含私有内存
  const rssMB = mem.private / 1024;
  if (rssMB > MEMORY_THRESHOLD_MB) {
    logger.warn(`主进程内存过高: ${rssMB.toFixed(0)}MB`);
    // 主动触发 GC（需要 --js-flags=--expose-gc）
    global.gc?.();
  }
}, 60_000);
```

**（4）V8 内存的认知**
Node 侧堆内存默认上限约 4GB（64 位），但 agent 的目标应该是常驻**几十 MB** 级别。堆增长先查：
- 全局 Map/数组只增不减（session 缓存、消息历史）
- 闭包引用（事件监听不移除）
- 大对象反复序列化产生的临时垃圾

### 4. 工程化：资源预算制度

给自己定硬性预算并写入监控：
- 空闲 CPU：&lt; 1%
- 主进程内存：&lt; 100MB
- 渲染进程（设置窗口打开时）：&lt; 200MB

超预算自动上报 + 本地生成 profile 快照，便于线上回溯。

### 5. 排查工具箱

- 主进程：`--inspect` + Chrome DevTools 的 Memory/Profiler
- 渲染进程：DevTools Performance Monitor 实时看 CPU/内存/DOM 节点数
- 线上：定期 `process.memoryInfo()` + `webContents.getProcessMemoryInfo()` 上报

## 面试话术

> 常驻应用的资源治理核心是"有界 + 对齐 + 隔离"：所有缓冲有容量上限，定时任务统一调度器对齐唤醒，重计算进 utilityProcess。渲染侧保持 backgroundThrottling、窗口用完销毁。再用内存预算 + 周期自检兜底。空闲 CPU &lt;1%、主进程内存百 MB 内是我做的 agent 的实际水位。

## 常见追问

- **GC 调优有用吗？** 有限，可以 `--max-old-space-size` 调上限，但根源永远是无界数据结构，调参治标。
- **怎么看哪个渲染进程占资源？** `app.getAppMetrics()` 返回所有进程的 CPU/内存，定位到具体 webContents。

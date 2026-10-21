# nodeIntegrationInWorker 和 nodeIntegrationInSubFrames 为什么必须关？

## 考察点

- Node 能力不止主页面一份开关
- iframe 和 Worker 是常见漏网

## 参考答案

### 1. 两个开关

```js
webPreferences: {
  nodeIntegration: false,
  nodeIntegrationInWorker: false,
  nodeIntegrationInSubFrames: false,
  contextIsolation: true,
  sandbox: true,
}
```

`nodeIntegration: false` 只保证**顶层页面**没有 Node。

- `nodeIntegrationInWorker`：Web Worker 里能否 `require`
- `nodeIntegrationInSubFrames`：iframe 里能否使用 Node 集成

这两个默认应保持关闭。打开任意一个，攻击者只要能在页面里创建 Worker 或 iframe，就还能碰到 Node，顶层关掉 Node 就没有意义。

### 2. 典型漏法

有人说“主页面很安全，只有 Worker 要读文件”，于是打开 `nodeIntegrationInWorker`。页面脚本可以 `new Worker(blobUrl)`，blob 里的内容来自字符串，XSS 就能把 Worker 源码换成自己的。

子框架同理。广告 iframe、预览 iframe 一旦和 Node 在一起，就和主页面打开 Node 等价。

### 3. Worker 要算大量数据时

用普通 Web Worker，数据用 `postMessage` 传进去，不要给它 Node。要读文件，让主进程读好再把 ArrayBuffer 转交给 Worker。

子框架要系统能力，就不要它要。让顶层页面通过白名单桥去做，子框架只显示。

### 4. 检查方式

在创建窗口的唯一工厂函数里写死这三个 `false`，不要每个窗口手写一份然后漏一个。代码审查搜 `nodeIntegrationInWorker: true`。

## 面试话术

> 关掉 nodeIntegration 不够，Worker 和 iframe 还有各自的开关。这两个保持 false，否则 XSS 可以新开一个 Worker 继续 require。重计算用没有 Node 的 Web Worker，文件让主进程读。窗口工厂里把三个开关写死。

## 常见追问

- **sandbox 开了是不是就不用管这两个？** sandbox 能限制进程，但仍不要主动把 Node 集成打开。默认值会随版本变，显式写成 false。
- **preload 会进 iframe 吗？** 子框架不一定执行父页面那份 preload。不要假设 iframe 里也有你的桥，更不要为了让它有桥去开 Node。

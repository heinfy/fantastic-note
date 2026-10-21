# webFrame.executeJavaScriptInIsolatedWorld 是干什么的？

## 考察点

- 隔离世界和页面主世界的执行差异
- 什么时候用它而不是 executeJavaScript

## 参考答案

### 1. 它在哪执行

`webFrame.executeJavaScriptInIsolatedWorld(worldId, scripts)` 在**指定的隔离世界**里跑脚本，不在页面主世界。

页面里的 XSS 改写 `Array.prototype` 或覆盖 `window.api`，影响不到这个世界里的脚本。脚本里的局部变量，页面也读不到。

适合：

- 从不可信页面上**读** DOM 结构（自动化、辅助功能）
- 在隔离环境里计算，再把纯数据交回主进程

不适合：

- 给自己的业务页面发数据（用 IPC）
- 往隔离世界里拼用户字符串

### 2. 和 executeJavaScript 的差别

| | executeJavaScript | executeJavaScriptInIsolatedWorld |
|---|---|---|
| 世界 | 页面主世界 | 指定 worldId |
| 能调用页面的 window.api | 能 | 不能，那是另一个世界的对象 |
| 能读 DOM | 能 | 能，DOM 是共享的 |
| 页面能否看见这段脚本的变量 | 能 | 不能 |

`worldId` 为 0 表示主世界，那就和 `executeJavaScript` 差不多了。preload 自己的隔离世界有固定 id，不要随便占一个新世界又不记录。

### 3. 调用位置

这个 API 在 preload 和主进程的 webFrame / webContents 相关入口上都能用到，具体以当前版本文档为准。原则不变：代码来自你自己的包，参数来自不可信页面时先做成数据，再传入。

读完 DOM 把结果 `post` 回主进程，不要在隔离世界里直接改不可信页面的逻辑，那种改动会和对方的升级缠在一起。

## 面试话术

> executeJavaScript 跑在页面主世界，能碰到业务桥。executeJavaScriptInIsolatedWorld 跑在单独世界，页面改原型链影响不到它，它也看不见 window.api，但能读同一份 DOM。用它从不可信页面读结构。给自己的页面传数据仍然用 IPC，不执行字符串。

## 常见追问

- **隔离世界能调用 contextBridge 暴露的函数吗？** 那些函数出现在主世界。隔离世界要和主进程通信，直接用 ipcRenderer，不要绕回页面。
- **worldId 冲突会怎样？** 两个功能共用一个世界，就会共用全局对象。不同用途分配不同的非 0 id。

# powerMonitor 电源事件有哪些？在 agent 场景怎么用？

## 考察点

- powerMonitor / powerSaveBlocker API
- agent 类应用对系统电源状态的响应设计

## 参考答案

### 1. 主要事件与 API

```js
const { powerMonitor } = require('electron');

powerMonitor.on('suspend', () => {});        // 系统即将休眠
powerMonitor.on('resume', () => {});         // 从休眠唤醒
powerMonitor.on('lock-screen', () => {});    // 锁屏（macOS/Windows）
powerMonitor.on('unlock-screen', () => {});  // 解锁
powerMonitor.on('on-ac', () => {});          // 接通电源
powerMonitor.on('on-battery', () => {});     // 使用电池

// 查询当前状态
powerMonitor.getSystemIdleTime();   // 系统空闲秒数（无输入）
powerMonitor.isOnBatteryPower();    // 是否电池供电
```

### 2. Agent 场景的典型应用

**（1）休眠/唤醒与长连接维护（最核心）**

系统休眠后网络断开、定时器暂停，唤醒瞬间 agent 必须立即恢复状态：

```js
powerMonitor.on('suspend', () => {
  // 休眠前：标记状态、停止心跳定时器
  heartbeat.stop();
  connection.markOffline('system-suspend');
});

powerMonitor.on('resume', () => {
  // 唤醒后：立即重连（此时 socket 大概率已死）
  logger.info('系统唤醒，重建连接');
  connection.reconnect();
  // 补报休眠期间错过的状态
  reportStatus();
});
```

不处理 resume 的典型症状：用户合盖一晚，第二天开盖后 agent 显示"在线"但实际 socket 早就被服务端断掉，消息全丢。

**（2）锁屏/解锁与安全**
- 锁屏时清空敏感信息展示、暂停屏幕采集类任务
- 解锁时刷新需要用户在场的数据

**（3）电源策略优化**
- 电池模式下降低采集频率、暂停大文件同步，省电
- `getSystemIdleTime` 判断用户离开：空闲超时自动暂停非必要任务（或反过来，空闲时才执行重的扫描任务，避免打扰用户）

### 3. powerSaveBlocker：阻止系统休眠

```js
const { powerSaveBlocker } = require('electron');

// 执行关键任务（如下载升级包、备份）时阻止休眠
const id = powerSaveBlocker.start('prevent-app-suspension');
// 还有 'prevent-display-sleep'：只阻止关屏

await doCriticalTask();

powerSaveBlocker.stop(id); // 任务完成立即释放
```

要点：
- **必须成对 stop**，泄漏会导致用户电脑永不休眠（耗电投诉）
- 建议封装成"任务锁"：多个任务引用计数，全部完成才 stop

### 4. 注意点

1. `powerMonitor` 事件**只能在 ready 之后使用**（模块在 ready 前不可访问）
2. `suspend` 事件**不能阻止休眠**（异步通知，系统不会等你），只能快速保存状态
3. 休眠期间 JS 定时器全部冻结，`setTimeout` 不会触发——不要依赖定时器检测唤醒
4. 虚拟机/远程桌面场景部分事件不触发，测试要用真机

## 面试话术

> agent 必须处理 suspend/resume：休眠前停心跳标记离线，唤醒立即重连补状态，否则就是"假在线"。关键任务用 powerSaveBlocker 防休眠但注意引用计数释放。idle 检测还可以做"用户离开后才执行重任务"的体验优化。

## 常见追问

- **怎么判断网络真的恢复了（唤醒后）？** resume 事件不代表网络就绪，重连要加退避重试，或先探测（`net.isOnline()` 或心跳 ping）。
- **Windows 现代待机（Modern Standby）有影响吗？** 有，S0 低功耗待机下 suspend/resume 行为与传统 S3 不同，网络断续更频繁，重连策略要更激进。

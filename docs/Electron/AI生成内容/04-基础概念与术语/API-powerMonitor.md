# powerMonitor 与 powerSaveBlocker

这两个模块都在主进程、并且在 `ready` 之后使用，用来感知电源状态和暂时阻止休眠。

文档：

- [https://www.electronjs.org/docs/latest/api/power-monitor](https://www.electronjs.org/docs/latest/api/power-monitor)
- [https://www.electronjs.org/docs/latest/api/power-save-blocker](https://www.electronjs.org/docs/latest/api/power-save-blocker)

## powerMonitor

```js
const { powerMonitor } = require('electron');

powerMonitor.on('suspend', () => stopHeartbeat());
powerMonitor.on('resume', () => reconnect());
powerMonitor.on('lock-screen', () => hideSensitiveView());
powerMonitor.on('unlock-screen', () => refreshView());
```

还有 `on-ac`（接通电源）和 `on-battery`（使用电池）。`getSystemIdleTime()` 返回用户没有键鼠输入的秒数。`isOnBatteryPower()` 查询当前是否在用电池。

`suspend` 发出时系统不会等待你的异步工作结束，只能尽快记下状态。休眠期间定时器是停的，唤醒后不要假设 WebSocket 还活着。

## powerSaveBlocker

```js
const { powerSaveBlocker } = require('electron');

const id = powerSaveBlocker.start('prevent-app-suspension');
await downloadUpdate();
powerSaveBlocker.stop(id);
```

`prevent-app-suspension` 阻止应用休眠，`prevent-display-sleep` 阻止显示器关闭。`start` 返回的 id 必须在任务结束后 `stop`。多个任务可以各自 `start`，并用引用计数保证最后一个结束才真正停止。

## 相关文档

- [概念-应用生命周期](./概念-应用生命周期.md)

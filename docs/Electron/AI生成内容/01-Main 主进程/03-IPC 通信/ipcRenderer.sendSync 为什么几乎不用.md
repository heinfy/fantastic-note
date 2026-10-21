# ipcRenderer.sendSync 为什么几乎不用？它卡的是哪一侧？

## 考察点

- 同步 IPC 的阻塞点
- 和 invoke 的取舍

## 参考答案

### 1. 它卡的是渲染进程

```js
// 渲染进程 / preload 里
const config = ipcRenderer.sendSync('config:get');
```

调用方会停在这一行，直到主进程的 `ipcMain.on` 用 `event.returnValue` 返回。被卡住的是**发起调用的那个进程的主线程**：

- 从渲染进程调用：页面掉帧、输入无响应，直到主进程回包
- 主进程当时如果还在忙别的 IPC，这个同步调用就在队列里干等

主进程本身不会因为这一次 `returnValue` 被永久卡死，但渲染进程在等待期间什么都画不了。

### 2. 为什么还能看到它

早期没有 `invoke` / `handle`。人们用 `sendSync` 拿“立刻要的配置”，或者用在 remote 模块内部。现在请求-响应应走 `invoke`：

```js
// preload
getConfig: () => ipcRenderer.invoke('config:get'),

// 主进程
ipcMain.handle('config:get', () => store.store);
```

`invoke` 也要等结果，但等待发生在 Promise 上，渲染进程可以继续处理输入和绘制。

### 3. 仅存的窄场景

有人会在**窗口第一次脚本执行前**用一次同步调用拿主题，避免页面先闪一下错误主题。即便如此也更推荐：

- 主进程在 `loadURL` 之前就把主题写进 `backgroundColor` 或通过 query 传给页面
- 或者页面先画骨架，配置到了再切换

不要在点击、滚动、渲染路径上使用 `sendSync`。

### 4. 和 send 的对比

| API | 渲染进程 | 有没有返回值 |
|-----|----------|--------------|
| `send` | 不阻塞 | 没有，要自己约定回传频道 |
| `sendSync` | 阻塞到主进程返回 | `event.returnValue` |
| `invoke` | 不阻塞 | Promise |

`sendSync` 的返回值同样走结构化克隆，不能传函数。主进程忘记设置 `returnValue` 时，渲染进程会一直停住或拿到 `undefined`，这类 bug 很不好查。

## 面试话术

> sendSync 卡住的是渲染进程主线程，主进程一忙界面就冻住。它是 invoke 出现之前的写法。现在要结果用 invoke，不要结果用 send。所谓启动时必须同步拿配置，也应该改成加载前由主进程把初始状态准备好。

## 常见追问

- **主进程里能同步等渲染进程吗？** 没有对等的官方同步 API，也不该有。主进程一等，所有窗口一起受影响。
- **invoke 会不会也堆在主进程里变慢？** 会。主进程事件循环被大计算占住时，invoke 只是不卡渲染，排队时间还在。重活要挪到 utilityProcess。

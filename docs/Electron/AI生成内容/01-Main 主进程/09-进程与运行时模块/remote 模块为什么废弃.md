# remote / @electron/remote 为什么废弃？和 invoke 相比差在哪？

## 考察点

- 对历史 API 的判断（还能不能用）
- 同步跨进程调用的性能和安全问题

## 参考答案

### 1. remote 当初做什么

`remote` 让渲染进程像调用本地对象一样调用主进程模块：

```js
// 旧写法，现在不要再写
const { BrowserWindow } = require('@electron/remote');
const win = BrowserWindow.getFocusedWindow();
win.minimize();
```

看起来省掉了 IPC 样板代码。Electron 14 从核心移除，社区包 `@electron/remote` 只是过渡，官方不再推荐。

### 2. 为什么废弃

**（1）每次属性访问都是同步 IPC**

`remote` 用代理对象。渲染进程读 `win.id`、调用 `win.minimize()`，底层都是 `sendSync`，**渲染进程主线程被卡住**等主进程返回。一个看起来无害的循环就能把界面打卡。

**（2）主进程对象泄漏到渲染进程**

渲染进程拿到的是主进程对象的远程引用。页面脚本（含 XSS）可以沿着这个引用调用 `BrowserWindow`、`dialog`、甚至 `require` 主进程模块，权限边界消失。

**（3）生命周期难推理**

远程对象的垃圾回收靠引用计数消息，窗口关了引用还在，就会出现“调用已销毁对象”和内存不释放。

### 3. 正确替代

能力收口到 preload，一次调用做完一件事：

```js
// preload：只暴露“最小化当前窗口”
contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
});

// 主进程：从 event 反查窗口，不把 BrowserWindow 交给页面
ipcMain.handle('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.minimize();
});
```

和 `remote` 的差别：

| | remote | invoke + 白名单 |
|---|---|---|
| 阻塞 | 同步，卡渲染进程 | 异步，不卡 UI |
| 暴露面 | 整个主进程模块 | 一个函数一件事 |
| 参数 | 渲染进程可任意调用方法 | 主进程校验参数 |
| 销毁 | 远程引用容易悬空 | 调用时现查窗口 |

### 4. 迁移时怎么搜

全局搜 `require('electron').remote`、`@electron/remote`、`enableRemoteModule`。`enableRemoteModule` 这个开关本身也已删除，老项目升级会直接报错。

## 面试话术

> remote 的问题是把主进程对象代理到渲染进程：每次属性访问都是同步 IPC，页面还能顺着引用调用任意主进程能力。替代方式是 invoke 加语义化 API，窗口身份从 event.sender 反查，不把 BrowserWindow 交出去。看到项目还在用 @electron/remote，我会把它当成待迁移债务，而不是新功能的写法。

## 常见追问

- **@electron/remote 现在还能跑吗？** 能装上，但新版本 Electron 上行为越来越脆，只适合老项目过渡，不适合新代码。
- **有没有必须同步拿主进程数据的场景？** 几乎没有。启动配置也改成窗口显示前 invoke 一次，不要 sendSync。

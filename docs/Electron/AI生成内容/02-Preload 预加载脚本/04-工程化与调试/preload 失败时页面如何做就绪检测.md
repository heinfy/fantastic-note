# preload 失败时，页面怎么做就绪检测？

## 考察点

- 桥没挂上时页面不要半死不活
- 检测要早，并且能区分“还没执行完”和“执行失败”

## 参考答案

### 1. 现象

preload 抛错后，页面仍会打开。业务代码访问 `window.api.getVersion` 才爆，堆栈在页面里，真正的错误在主进程终端。所以页面需要一个明确的就绪标记，而不是调用到一半才发现。

### 2. 标记由 preload 最后打上

```js
try {
  contextBridge.exposeInMainWorld('api', api);
  contextBridge.exposeInMainWorld('__preloadOk', true);
} catch (error) {
  // 桥失败时页面看不到这个标记
  ipcRenderer.send('log:preload-failed', String(error));
}
```

页面入口第一行：

```js
if (!window.__preloadOk || !window.api) {
  // 展示固定文案，不要再跑业务初始化
  showFatal('应用组件没有加载成功，请重新安装或联系支持');
  throw new Error('preload missing');
}
```

`__preloadOk` 只有 expose 成功才为 true。不要在 preload 第一行就设为 true。

### 3. 不要用超时猜

“等 2 秒还没有 api 就失败”会误伤慢机器。preload 在页面脚本之前执行，脚本运行时标记就应该已经在了。没有就是失败，不用等。

### 4. 和监控

主进程收到 `log:preload-failed` 打进日志。页面这条致命错误也上报，但上报通道如果就是那座桥，失败时页面上报不出去，所以**失败日志要在 preload 的 catch 里用 ipcRenderer 直接发**，不要经过还没暴露成功的 `window.api`。

自动化测试里断言 `window.__preloadOk === true`，能挡住路径配错的打包回归。

## 面试话术

> preload 在页面脚本前执行，所以入口处直接看 window.__preloadOk，没有就停，不用超时等待。标记写在 expose 成功之后。失败堆栈由 preload 自己用 ipcRenderer 记到主进程，因为这时 window.api 还不存在，页面报不了这条日志。

## 常见追问

- **用户看到这句话能自己修吗？** 通常不能。文案让他重开或重装，细节在日志里。常见原因是打包路径错了或 preload 语法错误。
- **开发时热更新 preload 会怎样？** 整页重载后标记会重新打。若热更新只换了页面没换 preload，标记还是旧桥，功能对不上，开发脚本应在 preload 变更时刷新窗口。

# 生产环境如何关闭 DevTools？只设 devTools: false 够不够？

## 考察点

- 关掉开发者工具不是安全边界
- 哪些入口要一起关，哪些关不掉

## 参考答案

### 1. 能关的入口

```js
const win = new BrowserWindow({
  webPreferences: {
    devTools: app.isPackaged ? false : true,
  },
});

// 菜单里不要留切换 DevTools 的 role
// 打包后再拦截快捷键
if (app.isPackaged) {
  win.webContents.on('before-input-event', (event, input) => {
    const openDevtools = input.key === 'F12'
      || (input.control && input.shift && input.key.toLowerCase() === 'i');
    if (openDevtools) event.preventDefault();
  });
}
```

`devTools: false` 会让 `webContents.openDevTools()` 失效，并影响默认快捷键。仍建议在打包版本里拦一次 `before-input-event`，因为不同平台的快捷键（macOS 上常见是 Alt+Command+I）不一定被你记得全。

应用菜单里如果用了 `{ role: 'toggleDevTools' }`，等于自己留了门。

### 2. 为什么这不是安全措施

用户仍可以：

- 改 asar 去掉这段限制（没有完整性校验时）
- 在主进程开了 `--inspect` 时挂上调试器（用 Fuses 关掉 inspect 参数）
- 直接阅读 asar 里的前端包

所以关 DevTools 只是减少误操作和浅层篡改，**不能**用来藏密钥或代替上下文隔离。密钥本来就不该出现在渲染进程。

### 3. 调试正式包问题

给支持人员的包可以带一个启动参数，并且这个参数只在内部签名渠道有效，同时把日志打到文件。不要让正式用户按一个隐藏快捷键就打开 DevTools。

崩溃和白屏靠日志、`render-process-gone` 和 sourcemap 符号化，不靠用户帮你打开控制台。

## 面试话术

> 正式包把 webPreferences.devTools 设为 false，菜单里不放 toggleDevTools，再用 before-input-event 拦 F12 和 Ctrl+Shift+I。这只是收起入口。源码在 asar 里，调试参数要用 Fuses 关。安全不依赖用户打不开控制台。

## 常见追问

- **开发环境会被误关吗？** 用 `app.isPackaged` 判断，不要用 `NODE_ENV`。打包脚本里 NODE_ENV 经常也是 production，但 `electron .` 调试时 isPackaged 仍是 false。
- **webview 里的 DevTools 呢？** guest 有自己的 webContents，工厂函数里同样设 `devTools: false`。

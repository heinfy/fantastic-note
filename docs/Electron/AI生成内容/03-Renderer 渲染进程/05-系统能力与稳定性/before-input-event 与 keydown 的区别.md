# before-input-event 和页面 keydown 有什么区别？怎么拦截刷新和 DevTools？

## 考察点

- 快捷键在输入到达页面前就能被主进程看见
- 拦截刷新时不要把输入框打坏

## 参考答案

### 1. 差别

页面里的 `keydown` 发生在渲染进程，网页可以 `stopPropagation`，焦点在 webview 里时父页面还收不到。

`webContents.on('before-input-event')` 在主进程、输入送给页面之前触发。适合作为应用级策略：

- 正式包禁止打开 DevTools
- 禁止 Ctrl+R 把单页应用整页刷掉（状态还没保存）
- 把缩放快捷键收口到自己的逻辑

```js
win.webContents.on('before-input-event', (event, input) => {
  if (input.type !== 'keyDown') return;

  const key = input.key.toLowerCase();
  const mod = input.control || input.meta;

  if (mod && key === 'r') {
    event.preventDefault();
    return;
  }
  if (key === 'f12' || (mod && input.shift && key === 'i')) {
    event.preventDefault();
  }
});
```

`preventDefault` 之后页面收不到这次按键。

### 2. 不要拦坏正常输入

Ctrl+R 在应用里可以拦。不要拦 Ctrl+C / Ctrl+V，否则输入框不能复制。不要拦所有带 Ctrl 的键。

刷新如果产品需要，改成应用内的“重新拉取数据”，而不是 `location.reload()`。用户按了 Ctrl+R 没有任何反馈也不好，可以发一条 IPC 让页面自己刷新列表。

### 3. 和菜单快捷键的顺序

菜单的 accelerator 也会吃掉快捷键。同一组合键不要既在菜单里触发“查找”，又在 `before-input-event` 里 preventDefault。应用级策略放一处。

全局生效、连应用在后台也要响应的，用 `globalShortcut`，不要用 before-input-event。后者只在这个 webContents 收到输入时触发。

## 面试话术

> 页面 keydown 拦不住子框架，也会被 stopPropagation。应用级快捷键用 webContents 的 before-input-event，在按键进页面前决定要不要 preventDefault。正式包拦刷新和 DevTools，不拦复制粘贴。后台全局热键才用 globalShortcut。

## 常见追问

- **macOS 的刷新是 Command+R，代码里怎么写？** 同时看 `input.meta` 和 `input.control`，不要只写 control。
- **能知道按键发生在哪个输入框吗？** 这个事件没有 DOM 目标。需要按控件区分时，让页面在焦点进入输入框时通知主进程，逻辑会更脆，能在主进程统一拦的就统一拦。

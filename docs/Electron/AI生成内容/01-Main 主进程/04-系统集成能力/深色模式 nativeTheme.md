# 深色模式怎么跟系统走？nativeTheme 和 prefers-color-scheme 是什么关系？

## 考察点

- 主题源在主进程
- 页面只消费媒体查询，不自己猜系统主题

## 参考答案

### 1. 关系

`nativeTheme.themeSource` 有三个值：`system`、`light`、`dark`。

它一变，所有渲染进程里的 CSS `prefers-color-scheme` 跟着变。页面不要用 Node 去读系统设置，只写媒体查询：

```css
:root { color-scheme: light; background: #f6f6f6; color: #1a1a1a; }
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; background: #1e1e1e; color: #f3f3f3; }
}
```

窗口的 `backgroundColor` 也要和主题一致，否则 `ready-to-show` 之前会闪一块白。

### 2. 让用户切换

```js
// 主进程
ipcMain.handle('theme:set', (_event, source) => {
  // source 只允许这三个值
  if (!['system', 'light', 'dark'].includes(source)) return;
  nativeTheme.themeSource = source;
  store.set('themeSource', source);
});

nativeTheme.on('updated', () => {
  const dark = nativeTheme.shouldUseDarkColors;
  for (const win of BrowserWindow.getAllWindows()) {
    win.setBackgroundColor(dark ? '#1e1e1e' : '#f6f6f6');
    win.webContents.send('theme:changed', dark);
  }
});
```

启动时在 `ready` 之后、创建窗口之前，把用户上次选的 `themeSource` 设回去。选 `system` 时，用户改系统外观会触发 `updated`，不用轮询。

### 3. 托盘和标题栏

macOS 托盘图标用 template image，系统会按菜单栏深浅上色。Windows 标题栏可以 `win.setTitleBarOverlay` 配深色背景。这些不跟随 CSS，要在 `updated` 里单独设。

### 4. 不要只在一个窗口里改 class

如果只给某个窗口的 `documentElement` 加 `class="dark"`，新开的窗口和系统切换都会漏。以 `nativeTheme` 为唯一来源，CSS 媒体查询才能所有窗口一致。

## 面试话术

> 主题开关放在主进程的 nativeTheme.themeSource。页面只用 prefers-color-scheme，这样所有窗口一起变。用户选择持久化，启动时在建窗口前设回去。系统外观变化听 updated，同时改 backgroundColor 和托盘，避免白屏闪一下和图标颜色不对。

## 常见追问

- **渲染进程能读 shouldUseDarkColors 吗？** 不要直接读。需要初始值就 invoke 问主进程，之后等 `theme:changed`。
- **第三方页面不跟主题？** 远程页面有自己的配色，不要强行注入。只保证自己的壳和背景色不闪。

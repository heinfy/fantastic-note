# nativeTheme

`nativeTheme` 读取和设置应用的浅色、深色外观。它在主进程使用。改变 `themeSource` 后，渲染进程里的 CSS 媒体查询 `prefers-color-scheme` 会一起变化。

文档：[https://www.electronjs.org/docs/latest/tutorial/dark-mode](https://www.electronjs.org/docs/latest/tutorial/dark-mode)、`nativeTheme` API 页。

## themeSource

取值是 `'system'`、`'light'`、`'dark'`。`'system'` 表示跟随操作系统。

```js
const { nativeTheme, ipcMain } = require('electron');

ipcMain.handle('theme:set', (_event, source) => {
  nativeTheme.themeSource = source;
  return nativeTheme.shouldUseDarkColors;
});
```

`shouldUseDarkColors` 表示当前是否按深色绘制。系统外观变化时发出 `updated`。在这个事件里同步窗口 `backgroundColor` 和托盘图标，避免闪一下相反的颜色。

## 页面怎么写

页面只写媒体查询，不自己探测系统设置：

```css
body { background: #f5f5f5; color: #222; }
@media (prefers-color-scheme: dark) {
  body { background: #1e1e1e; color: #eee; }
}
```

用户的选择存在 `userData`，下次启动时在创建窗口之前写回 `themeSource`。

## 相关文档

- [API-nativeImage](./API-nativeImage.md)
- [概念-主进程与渲染进程](./概念-主进程与渲染进程.md)

# ready-to-show

`ready-to-show` 是 `BrowserWindow` 的事件，在页面第一次完成绘制、可以显示时发出。搭配创建窗口时的 `show: false`，用户就不会看到一段白屏。

```js
const win = new BrowserWindow({
  show: false,
  backgroundColor: '#1e1e1e',
});
win.once('ready-to-show', () => win.show());
win.loadFile('index.html');
```

`backgroundColor` 使用和页面一致的颜色，绘制完成前的那一帧也是预期的底色。

它和 `app` 的 `ready` 不是同一个事件：

| 事件 | 发出者 | 含义 |
|------|--------|------|
| `ready` | `app` | 应用可以创建窗口 |
| `ready-to-show` | 某一个 `BrowserWindow` | 这个窗口可以显示 |
| `did-finish-load` | `webContents` | 页面导航完成，不代表已经画出第一帧 |

若页面一直不绘制（预加载脚本抛错、地址错误），`ready-to-show` 可能迟迟不来。可以再监听 `did-fail-load`，超时后显示错误页。

## 相关文档

- [API-BrowserWindow](./API-BrowserWindow.md)
- [概念-应用生命周期](./概念-应用生命周期.md)

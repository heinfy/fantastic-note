# globalShortcut

`globalShortcut` 在操作系统层面注册快捷键。应用在后台、没有焦点时也能收到。只能在主进程、并且在 `app.ready` 之后使用。

文档：[https://www.electronjs.org/docs/latest/api/global-shortcut](https://www.electronjs.org/docs/latest/api/global-shortcut)

## 用法

```js
const { globalShortcut, app } = require('electron');

app.whenReady().then(() => {
  const ok = globalShortcut.register('CommandOrControl+Shift+A', () => {
    toggleWindow();
  });
  if (!ok) console.log('快捷键已被占用');
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

`register` 返回布尔值。组合键已经被系统或其他程序占用时返回 `false`，不会抢过来。`isRegistered` 用来查询。

## 和其他快捷键的差别

| 方式 | 何时生效 |
|------|----------|
| `globalShortcut` | 只要系统把这个组合键交给本应用，即使窗口在后台 |
| 菜单的 `accelerator` | 应用处于前台 |
| 页面 `keydown` | 焦点在该页面里 |

只在应用内使用的保存、查找，放在菜单 accelerator。需要从任何软件里唤起窗口，才用全局快捷键。

快捷键字符串与菜单相同，例如 `CommandOrControl+Shift+K`、`Alt+Space`。`CommandOrControl` 在 macOS 上是 Command，在 Windows 和 Linux 上是 Control。

监听“任意按键抬起”不是这个模块的能力。它注册的是一个组合键被按下时的回调。

## 相关文档

- [API-Menu](./API-Menu.md)
- [API-app](./API-app.md)

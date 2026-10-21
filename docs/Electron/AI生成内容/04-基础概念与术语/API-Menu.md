# Menu 与 MenuItem

`Menu` 和 `MenuItem` 用来创建应用菜单和右键菜单。它们运行在主进程。

文档：[https://www.electronjs.org/docs/latest/api/menu](https://www.electronjs.org/docs/latest/api/menu)

## 应用菜单

macOS 的菜单在屏幕顶部，不属于某一个窗口。需要 `Menu.setApplicationMenu`。第一项习惯上是应用名，编辑菜单使用 `role`，这样复制、粘贴和对应快捷键由 Electron 填好。

```js
const { Menu } = require('electron');

const menu = Menu.buildFromTemplate([
  {
    label: '编辑',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
]);

Menu.setApplicationMenu(menu);
```

`role` 还有 `about`、`quit`、`reload`、`toggleDevTools`、`window` 等。自定义项写 `label`、`accelerator` 和 `click`。`accelerator` 使用 `CommandOrControl+S` 这种跨平台写法。

Windows 上这份菜单出现在窗口标题栏下方。`frame: false` 的窗口如果去掉了应用菜单，输入框仍需要复制粘贴能力，可以保留一份只含编辑 role 的菜单。

## 右键菜单

```js
menu.popup({ window: win });
```

`Menu.buildFromTemplate` 的返回值是 `Menu` 实例。菜单项状态变化时，重新构建再设置，而不是改已显示的单个对象。

## 相关文档

- [API-Tray](./API-Tray.md)
- [概念-应用生命周期](./概念-应用生命周期.md)

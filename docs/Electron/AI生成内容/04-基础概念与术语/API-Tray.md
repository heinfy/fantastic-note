# Tray

`Tray` 在系统托盘（macOS 菜单栏、Windows 通知区域）放一个图标。它属于主进程，适合常驻应用的入口。

文档：[https://www.electronjs.org/docs/latest/api/tray](https://www.electronjs.org/docs/latest/api/tray)

## 创建

```js
const { Tray, Menu, nativeImage } = require('electron');

const image = nativeImage.createFromPath(iconPath);
const tray = new Tray(image);
tray.setToolTip('我的应用');
tray.setContextMenu(Menu.buildFromTemplate([
  { label: '打开', click: () => showWindow() },
  { type: 'separator' },
  { label: '退出', click: () => app.quit() },
]));
tray.on('click', () => showWindow());
```

把 `tray` 放在模块级变量里。如果没有任何引用，图标会在垃圾回收后消失。

## 平台差别

- macOS：使用模板图（template image），文件名以 `Template` 结尾或调用 `setTemplateImage(true)`，系统会按菜单栏深浅着色。
- Windows：可以监听 `click` 和 `double-click`，并用 `displayBalloon` 显示气泡。图标准备 16 和 32 两档更清晰。
- Linux：是否出现托盘取决于桌面环境，GNOME 往往需要额外扩展。

图标如果放在 asar 里，有的系统接口需要真实路径。打包后图标丢失时，把图标放到 `extraResources`，或确认 `nativeImage` 能从 asar 读出。

## 相关文档

- [API-nativeImage](./API-nativeImage.md)
- [API-Menu](./API-Menu.md)

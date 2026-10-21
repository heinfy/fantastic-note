# 托盘 Tray 的实现要点？macOS 与 Windows 的差异？

## 考察点

- Tray API 的完整使用
- 平台差异细节（template image、点击行为）

## 参考答案

### 1. 基本实现

```js
const { Tray, Menu, nativeImage } = require('electron');

let tray = null;

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'tray-icon.png'));
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开主面板', click: () => showMainWindow() },
    { label: '状态：运行中', enabled: false }, // 只读状态项
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('My Agent');
  tray.setContextMenu(contextMenu);

  // Windows/Linux：单击托盘图标通常打开窗口
  tray.on('click', () => showMainWindow());
}
```

### 2. 平台差异（高频考点）

**macOS**
- 托盘图标应该用 **Template Image**（命名以 `Template` 结尾，如 `iconTemplate.png`），系统会自动适配深色/浅色菜单栏：

```js
const icon = nativeImage.createFromPath('iconTemplate.png');
icon.setTemplateImage(true); // 或靠文件名约定
```

- macOS 上点击托盘图标默认只弹菜单，`click` 事件可用但交互习惯不同
- 图标尺寸建议 16x16 / 22x22 @2x

**Windows**
- 支持双击（`double-click`）事件
- 支持气泡通知 `tray.displayBalloon({ title, content, icon })`（Windows 10+ 会转成系统通知）
- 图标建议 ico 格式或多尺寸 png（16/32）
- 托盘图标闪烁：`setImage` 交替切换两张图实现（如消息提醒）

**Linux**
- 桌面环境差异极大（GNOME 默认不支持托盘，需 AppIndicator 扩展），功能要降级处理

### 3. 常见坑

1. **Tray 必须持有引用**：`let tray` 挂在模块级变量，如果被 GC 回收托盘会消失——这是"托盘偶发消失"的经典原因。

2. **打包后图标路径**：开发环境的相对路径在 asar 包里要用 `path.join(__dirname, ...)` 且图标需 `asarUnpack` 或放入 `extraResources`，否则读不到。

3. **动态更新菜单**：菜单项状态变化（运行中/已暂停）要重建整个 Menu 再 `setContextMenu`，不能修改单条目。

4. **高 DPI 模糊**：提供 @2x 图并用 `nativeImage` 的多分辨率 API：

```js
const icon = nativeImage.createEmpty();
icon.addRepresentation({ scaleFactor: 1, buffer: png1x });
icon.addRepresentation({ scaleFactor: 2, buffer: png2x });
```

### 4. Agent 场景的典型交互

- 左键点击：显示/隐藏主面板（toggle）
- 右键：菜单（状态、暂停任务、设置、退出）
- 新消息：图标闪烁 / 角标（Windows overlay，macOS 用 `app.dock.setBadge`）

## 面试话术

> 托盘是 agent 的主入口。要点：macOS 用 Template Image 适配深色模式；Tray 必须模块级持引用防 GC；打包注意图标 asar 路径问题；菜单状态变化要整体重建。Windows 还可以做闪烁提醒和气泡通知。

## 常见追问

- **托盘菜单能实现二级菜单吗？** 能，menu item 的 `submenu` 字段嵌套。
- **怎么实现"开机启动后只驻留托盘不开窗"？** ready 后不创建窗口只创建 Tray，配合 `app.setLoginItemSettings` 的静默启动参数。

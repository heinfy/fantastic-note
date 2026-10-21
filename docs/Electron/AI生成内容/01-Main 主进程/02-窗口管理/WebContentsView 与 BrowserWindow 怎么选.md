# BrowserView 为什么废弃？WebContentsView 和 BrowserWindow 怎么选？

## 考察点

- 知道 BrowserView 已废弃
- 顶层窗口和窗口内嵌页面的划分

## 参考答案

### 1. 三个概念

| API | 角色 | 现状 |
|-----|------|------|
| `BrowserWindow` | 一个操作系统窗口，自带一份 `webContents` | 仍然是普通应用的默认选择 |
| `BrowserView` | 嵌进某个窗口里的额外网页层 | 已废弃 |
| `BaseWindow` + `WebContentsView` | 窗口外壳和网页内容拆开，内容用 view 贴进去 | BrowserView 的替代 |

`BrowserWindow` 适合“一个窗口一份页面”：主界面、设置、关于。

窗口**内部**还要嵌一块独立网页（浏览器壳、文档预览、第三方登录页）时，用 `WebContentsView`，不要用已经废弃的 `BrowserView`，也不要默认用 `<webview>`。

### 2. WebContentsView 示例

```js
const { BaseWindow, WebContentsView } = require('electron');

const win = new BaseWindow({ width: 1200, height: 800 });

const content = new WebContentsView({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
});

win.contentView.addChildView(content);
content.setBounds({ x: 0, y: 48, width: 1200, height: 752 });
content.webContents.loadURL('myapp://app/index.html');
```

窗口尺寸变化时要自己 `setBounds`。这是它和 `BrowserWindow` 的差别：布局由你算，系统不会替你拉伸网页。

### 3. 怎么选

- 独立窗口、有系统标题栏或自己的无边框壳：`BrowserWindow`
- 一个窗口里上下两块都是网页（标签栏 + 内容区），或者内容区要换不同来源：`BaseWindow` 加多个 `WebContentsView`
- 只是同一页面里的一块 UI：用前端组件，不要为了分进程再开一个 view

每个 view 都是一份渲染进程开销（几十到上百 MB）。嵌 10 个 view 等于 10 个渲染进程，要有预算。

### 4. 远程页面单独一个 view

第三方页面放进自己的 `WebContentsView`，`webPreferences` 不挂业务 preload。导航用 `will-navigate`、`setWindowOpenHandler` 限制域名。这样第三方脚本碰不到 `window.api`。

## 面试话术

> BrowserView 已经废弃，替代是 WebContentsView。普通窗口继续用 BrowserWindow。只有一个系统窗口里要嵌多块独立网页时，才用 BaseWindow 把 view 贴进去，并自己管 bounds。远程页面单独一个 view，不挂业务 preload。view 的数量就是渲染进程的数量。

## 常见追问

- **和 iframe 比呢？** iframe 在同一个文档里，隔离和权限都弱于独立 webContents。不可信内容更适合独立 view。
- **焦点和快捷键怎么走？** 快捷键要看当前焦点在哪个 webContents 上，`before-input-event` 要分别注册。

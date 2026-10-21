# app 的生命周期事件有哪些？macOS 和 Windows 的行为差异？

## 考察点

- 生命周期事件的触发时机与顺序
- 跨平台行为差异（这是最容易暴露"有没有真正做过 Mac 版"的点）

## 参考答案

### 核心生命周期事件（按大致顺序）

| 事件 | 触发时机 |
|------|---------|
| `will-finish-launching` | 应用启动初期（macOS 常在此注册 open-file 等） |
| `ready` | Electron 初始化完成，**创建窗口必须在此之后** |
| `window-all-closed` | 所有窗口都关闭时 |
| `before-quit` | 退出流程开始（可 `event.preventDefault()` 阻止退出） |
| `will-quit` | 即将退出（窗口已关闭，做最后清理，如注销全局快捷键） |
| `quit` / `will-quit` 之后 | 进程退出 |
| `activate`（仅 macOS） | Dock 图标点击、应用被重新激活 |

### macOS 与 Windows 的关键差异

**1. 关闭所有窗口后的行为**
- **Windows/Linux**：约定俗成退出应用，所以默认在 `window-all-closed` 里 `app.quit()`
- **macOS**：应用继续驻留（Dock 图标还在），点 Dock 图标应重新创建窗口

```js
// 经典模板代码
app.on('window-all-closed', () => {
  // macOS 下不退出，保持驻留
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS 点 Dock 图标时没有窗口则重建
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

**2. `activate` 只有 macOS 触发**，Windows 上没有等价事件（Windows 靠托盘点击处理）。

**3. 退出路径差异**
- macOS 用户习惯 `Cmd+Q` 退出；agent 类应用常拦截 `before-quit`，把"关闭"变成"隐藏到托盘"，用 `isQuiting` 标记区分真正退出：

```js
let isQuiting = false;

app.on('before-quit', () => {
  isQuiting = true; // 标记：这次是真的要退出
});

win.on('close', (e) => {
  if (!isQuiting) {
    e.preventDefault(); // 拦截关闭，只隐藏窗口
    win.hide();
  }
});
```

### Agent 场景补充

- `window-all-closed` 对纯后台 agent 通常**什么都不做**（窗口只是设置入口，退出靠托盘菜单显式退出）
- `before-quit` 里做优雅清理：关闭本地服务、断开长连接、写最后一条日志

## 常见追问

- **`ready` 之前能做什么？** 注册自定义协议特权 scheme（`protocol.registerSchemesAsPrivileged` 必须在 ready 前）、单实例锁。
- **`will-quit` 里能阻止退出吗？** 不能，此时阻止退出要用 `before-quit`。

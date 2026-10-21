# globalShortcut 全局快捷键怎么用？注册失败/冲突怎么处理？

## 考察点

- globalShortcut API 的生命周期管理
- 冲突处理与平台权限差异

## 参考答案

### 1. 基本用法

```js
const { globalShortcut, app } = require('electron');

app.whenReady().then(() => {
  // 必须在 ready 之后注册
  const ok = globalShortcut.register('CommandOrControl+Shift+A', () => {
    toggleMainWindow(); // 唤起/隐藏主窗口
  });

  if (!ok) {
    // 注册失败：组合键被系统或其他应用占用
    logger.warn('全局快捷键注册失败');
  }

  // 检查是否注册成功
  console.log(globalShortcut.isRegistered('CommandOrControl+Shift+A'));
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll(); // 退出时必须注销
});
```

### 2. 核心机制理解

- 注册的是**系统级钩子**：应用退到后台、最小化、甚至无窗口时都能收到
- **先到先得**：同一组合键被别的应用先注册，你的 register 就返回 false（不会抢占）
- 只在主进程可用

### 3. 冲突处理策略

**（1）注册失败检测 + 用户引导**

```js
function registerHotkey(accelerator) {
  const ok = globalShortcut.register(accelerator, onHotkey);
  if (!ok) {
    // 通知渲染进程弹出提示：快捷键被占用，请修改
    mainWindow?.webContents.send('hotkey:register-failed', accelerator);
    return false;
  }
  return true;
}
```

**（2）支持用户自定义快捷键**
- 设置页让用户录制快捷键（监听 keydown 组合成 accelerator 字符串）
- 修改流程：先 `unregister` 旧的 → `register` 新的 → 失败则回滚旧的并提示
- accelerator 语法：`CommandOrControl`（跨平台映射 Cmd/Ctrl）、`Alt`、`Shift`、`Super`，功能键 `F1-F24`，方向键 `Up/Down` 等

**（3）多快捷键管理**
用 Map 维护 accelerator → callback 的映射，统一注册/注销，避免散落各处忘记释放。

### 4. 平台差异与权限

- **macOS**：普通全局快捷键（注册型）不需要权限；但如果你是**监听型**（监听全局键盘输入，如实现全局划词），需要 CGEventTap，要**辅助功能权限**——这是两种完全不同的技术路线，面试要分清
- **Windows**：`Ctrl+Alt+Del`、`Win+L` 等系统保留组合无法注册；媒体键部分支持
- **Wayland（Linux）**：全局快捷键支持残缺，X11 正常——Linux 下要做降级

### 5. 常见坑

1. **ready 之前注册会静默失败**
2. **忘记 will-quit 注销**：虽然进程退出系统会清理，但热重载开发时会残留
3. **accelerator 字符串格式错**（如 `Ctrl+` 后面没键名）注册返回 false 而不是抛错，要检查返回值
4. **与应用内快捷键混淆**：应用内快捷键用菜单的 `accelerator` 或渲染进程的 keydown，只有需要"全局"才用 globalShortcut

## 面试话术

> 注册型全局快捷键用 globalShortcut，核心处理是注册失败回滚与用户自定义。要注意它和"全局键盘监听"是两条路线：前者系统分发无需权限，后者（CGEventTap/HOOK）需要辅助功能权限，场景不同不能混用。

## 常见追问

- **应用内快捷键冲突怎么办？** 优先用 Menu 的 accelerator（与系统菜单集成好），渲染进程的 keydown 处理注意输入框聚焦时不触发。
- **如何实现"按住说话"这类按下/抬起都感知？** globalShortcut 只触发按下，抬起需要用低级钩子（iohook 之类的原生模块）或 CGEventTap。

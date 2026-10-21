# 系统通知 Notification 怎么做？macOS 和 Windows 有什么差异？

## 考察点

- 主进程通知 API
- 点击通知后把应用叫到前台

## 参考答案

### 1. 主进程创建通知

```js
const { Notification } = require('electron');

function notify({ title, body, id }) {
  if (!Notification.isSupported()) return;

  const n = new Notification({ title, body, silent: false });
  n.on('click', () => {
    // 用户点通知：展示窗口并让页面打开对应记录
    showMainWindow();
    mainWindow.webContents.send('notify:open', id);
  });
  n.show();
}
```

渲染进程里的 `new window.Notification()` 走的是网页通知，权限和点击行为都更绕。agent 的后台提醒放在主进程，窗口关掉也能弹。

### 2. 平台差异

**Windows**

- 需要设置 AppUserModelId，安装包（electron-builder）一般会写好。没设置时通知可能不出现，或点进去找不到应用
- 通知中心里的名称和图标来自安装信息和快捷方式
- 应用没运行时点击通知，不会自动执行你的 `click` 回调；那是系统激活应用，要在启动参数里恢复

**macOS**

- 通知出现在通知中心，受系统“专注模式”和用户对该应用的通知开关影响
- 开发态签名是 Electron 时，授权记录在 Electron 上，换正式包要重新允许
- Dock 角标用 `app.dock.setBadge('1')`，和通知是两套 API。Windows 任务栏闪烁用 `win.flashFrame(true)`

### 3. 不要用通知传敏感内容

锁屏上会露出标题和正文。内容用“你有一条新任务”，不要把验证码、客户姓名写进 body。

点击后再到应用里拉详情。

### 4. 权限

网页通知要先过 `session.setPermissionRequestHandler`。主进程 `Notification` 不走这个网页权限框，但挡不住用户在系统设置里把应用通知关掉。发不出去时不要重试风暴，应用内列表仍保留这条消息。

## 面试话术

> 后台提醒用主进程的 Notification，click 里把窗口叫起来并带上业务 id。Windows 依赖 AppUserModelId，macOS 受系统通知开关影响，开发签名和正式签名的授权不共用。锁屏可见，所以正文不放敏感信息。角标和任务栏闪烁是各自平台的另一套 API。

## 常见追问

- **通知太多怎么办？** 做合并：短时间多条收成“3 条新消息”，避免把通知中心打满。
- **能带按钮吗？** Electron 的 Notification 对 action 支持有限，复杂操作让用户点进应用再做。

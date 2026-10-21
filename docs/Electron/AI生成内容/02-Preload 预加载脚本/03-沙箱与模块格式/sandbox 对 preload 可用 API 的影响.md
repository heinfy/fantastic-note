# sandbox: true/false 对 preload 可用 API 有什么影响？

## 考察点

- sandbox 模式下 preload 的能力边界
- "preload 里 require fs 报错"的经典问题

## 参考答案

### 1. 两种模式的能力对比

| | `sandbox: false` | `sandbox: true`（推荐） |
|---|---|---|
| Node 内置模块（fs/path/os） | ✅ 完整可用 | ❌ 不可用 |
| npm 包 require | ✅ | ❌ |
| `require('electron')` | ✅ 全部 | ⚠️ 仅 ipcRenderer、contextBridge、webFrame 等 |
| 其他可用 | 完整 Node | `events`、`timers`、`url` 等极少数 polyfill |
| OS 级沙箱保护 | 无 | 有（Chromium 沙箱限制系统调用） |

sandbox 开启时，preload 里的 `require` 是一个**阉割版**：

```js
// sandbox: true 的 preload 中
const { ipcRenderer, contextBridge } = require('electron'); // ✅ 可用
const fs = require('fs');        // ❌ 报错：module not found
const _ = require('lodash');     // ❌ 报错
```

### 2. 典型踩坑场景

**"我想在 preload 里读个本地配置文件再暴露给页面"**

```js
// ❌ sandbox: true 下失败
const fs = require('fs');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
contextBridge.exposeInMainWorld('config', config);
```

**正确解法：把 Node 能力挪到主进程，preload 只走 IPC**

```js
// preload（sandbox 兼容写法）
contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'), // 主进程读文件
});

// 主进程
ipcMain.handle('config:get', async () => {
  return JSON.parse(await fs.readFile(configPath, 'utf-8'));
});
```

代价是多一次异步 IPC（配置从同步读取变异步获取），换来整个渲染进程被 OS 沙箱保护。

### 3. 什么时候可以关 sandbox

只有 preload **必须**直接用 Node 能力且无法走 IPC 的场景，例如：
- preload 需要加载一个大的 npm 工具库做页面注入前的预处理
- 遗留项目迁移过渡期

关 sandbox 时的补救措施：
- contextIsolation 必须保持 true
- 桥接 API 审查标准提高一档（preload 权限大，泄露面更大）
- 明确记录该窗口为什么需要 sandbox: false，防止蔓延成默认配置

### 4. 架构原则

```
理想分层：
┌──────────────────────────────┐
│ 渲染进程（sandbox）           │  纯 UI，无 Node
│   ↑ 白名单桥                  │
│ preload（sandbox）            │  只有 ipcRenderer + contextBridge
│   ↑ IPC                       │
│ 主进程                        │  所有 Node 能力、文件、系统调用
└──────────────────────────────┘
```

preload 的宿命是"**桥，不是处理器**"——它存在的意义是把主进程能力安全地摆渡给页面，而不是自己干活。凡是想在 preload 里干的活，99% 都应该放主进程。

### 5. 默认值注意

- Electron 20+：无 preload 的渲染进程默认 sandbox
- 有 preload 时默认 sandbox 是 false（历史原因）——所以**推荐显式写 `sandbox: true`**，不依赖默认值

## 面试话术

> sandbox 开启后 preload 的 require 是阉割版：electron 里只有 ipcRenderer/contextBridge/webFrame 可用，fs 和 npm 包全废。这是"preload 读文件报错"的根因。正确架构是把 Node 能力全部沉到主进程，preload 只做 IPC 摆渡；显式写 sandbox: true 不依赖默认值。

## 常见追问

- **sandbox 怎么实现限制的？** Chromium 沙箱在 OS 层限制进程系统调用（seccomp/Seatbelt），渲染进程内 V8 暴露的 Node API 被裁剪。
- **sandbox 与 contextIsolation 的关系？** 正交：sandbox 管进程与 OS 的边界，contextIsolation 管 preload 与页面的 JS 边界，两个都开才是完整防线。

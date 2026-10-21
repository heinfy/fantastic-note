# nodeIntegration、contextIsolation、sandbox 三者的关系？推荐配置？

## 考察点

- 三个安全开关各自控制什么（最容易混淆的概念组）
- 默认值的历史变迁与推荐基线

## 参考答案

### 1. 各自控制什么

**（1）nodeIntegration：渲染进程能否直接用 Node**
- `true`：页面 JS 里可以 `require('fs')`、`require('child_process')`
- `false`（推荐）：页面是纯 Web 环境
- 风险：加载的远程内容一旦有 XSS，攻击者直接获得系统级能力（读文件、执行命令）

**（2）contextIsolation：preload 与页面的 JS 上下文是否隔离**
- `true`（推荐）：preload 跑在隔离的 JS world，页面无法访问 preload 里的 `ipcRenderer` 等对象，只能通过 contextBridge 暴露的白名单 API 交互
- `false`：preload 和页面共享全局对象，页面可以篡改/读取 preload 的一切（比如改写 `ipcRenderer.send` 伪造消息）
- 注意：它隔离的是 **JS 上下文**，两个 world 操作的是**同一个 DOM**

**（3）sandbox：是否启用 Chromium 沙箱**
- `true`（推荐）：渲染进程是 OS 级沙箱进程，系统调用被严格限制，即使渲染进程被完全攻破（如 V8 0day），也难以直接伤害系统
- sandbox 开启时，preload 只能用阉割版 require（仅 electron 等少数模块）
- 这是浏览器级别的最后一道防线

### 2. 三者的层次关系

```
攻击面逐层收窄：

nodeIntegration: false     →  页面拿不到 Node 能力
        ↓ （但 preload 有 Node 能力，怎么办？）
contextIsolation: true     →  页面碰不到 preload 的上下文，只能走白名单桥
        ↓ （preload 被绕过/桥有漏洞怎么办？）
sandbox: true              →  整个渲染进程被 OS 沙箱关住，系统调用受限
```

一句话：**nodeIntegration 管"页面"，contextIsolation 管"页面与 preload 的边界"，sandbox 管"进程与 OS 的边界"**。

### 3. 推荐配置（当前最佳实践）

```js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true, // preload 需要 fs 等能力时才关闭，并收紧桥接设计
  },
});
```

### 4. 默认值变迁（面试加分项）

| 版本 | 变化 |
|------|------|
| Electron 12 | contextIsolation 默认 false → **true**（老项目升级白屏的经典原因） |
| Electron 20 | 无 preload 的渲染进程默认 sandbox |
| 历史 | nodeIntegration 早期默认 true（Electron 5 起默认 false） |

老项目升级的兼容性公式（不推荐长期使用）：`nodeIntegration: true + contextIsolation: false` 可以回到旧行为，但等于裸奔。

### 5. 实践中的取舍

- sandbox 开启后 preload 无法 `require('fs')`，如果 preload 需要读本地配置：
  - 方案一：把读文件逻辑挪到主进程，preload 通过 IPC 获取（推荐）
  - 方案二：`sandbox: false`，此时 preload 有完整 Node，更要严格用 contextBridge 收敛暴露面
- `<webview>` 标签内默认隔离级别不同，嵌入不可信内容时单独审查

## 面试话术

> 三者是三道不同层次的防线：nodeIntegration 决定页面有没有 Node 能力，contextIsolation 决定页面能不能碰到 preload 的上下文，sandbox 决定渲染进程被攻破后能不能伤害 OS。推荐全关/全开的基线（false/true/true），能力通过 contextBridge 白名单桥接。12 版本 contextIsolation 默认开启是升级事故高发点。

## 常见追问

- **contextIsolation 开启后 preload 怎么操作 DOM？** 可以，共享 DOM 不共享 JS 全局对象，preload 里 document 正常用。
- **sandbox 开了性能有影响吗？** 极小，浏览器本来就是这么跑的。

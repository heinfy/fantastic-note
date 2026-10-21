# 为什么不能直接把 ipcRenderer 挂到 window 上？正确的桥接姿势是什么？

## 考察点

- 安全模型的核心理解（几乎是 Electron 面试第一题）
- 白名单桥接的设计能力

## 参考答案

### 1. 直接暴露的危害

```js
// ❌ 危险写法一：contextIsolation 关闭时直接挂
window.ipcRenderer = require('electron').ipcRenderer;

// ❌ 危险写法二：contextBridge 也不行（绑定对象克隆会报错，
//    即使包一层也等于全量暴露）
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (...args) => ipcRenderer.invoke(...args), // 等于没包
  send: (...args) => ipcRenderer.send(...args),
});
```

一旦页面（或页面里的 XSS 脚本）拿到完整 ipcRenderer：

```js
// 攻击者在页面控制台/XSS 载荷中可以为所欲为：
await window.ipcRenderer.invoke('file:read', '/etc/passwd');  // 读任意文件
await window.ipcRenderer.invoke('shell:exec', 'rm -rf ~');     // 执行命令
window.ipcRenderer.send('user:logout');                        // 伪造事件
```

**全量 ipcRenderer = 页面可以调用主进程注册的所有通道**，preload 精心设计的权限边界瞬间归零。

### 2. 正确姿势：语义化白名单 API

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  user: {
    // 只暴露"获取当前用户"这一个能力
    // 通道名、参数格式全部收敛在 preload 内部
    getCurrent: () => ipcRenderer.invoke('user:get-current'),
  },
  file: {
    // 不允许任意路径，只允许选择文件对话框
    pick: () => ipcRenderer.invoke('dialog:pick-file'),
  },
  window: {
    minimize: () => ipcRenderer.send('window:min'),
  },
  // 订阅类 API 返回取消函数，且 channel 收敛
  onTaskProgress: (callback) => {
    const listener = (_e, data) => callback(data);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
});
```

设计要点：
1. **页面只见到业务语义**（`api.user.getCurrent`），见不到通道名（`user:get-current`）——通道成了内部实现细节
2. **每个 API 只做一件事**，参数由 preload 固定或严格约束，页面无法注入任意参数
3. **绝不透传可变通道名**：

```js
// ❌ 这种"万能桥"等于裸奔
contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
```

### 3. 灰度地带：受限通道前缀（不推荐但有场景）

有些团队图方便做"前缀白名单"：

```js
// ⚠️ 折中方案：只允许特定前缀的通道
const ALLOWED_PREFIX = 'renderer:';
contextBridge.exposeInMainWorld('api', {
  invoke: (channel, ...args) => {
    if (!channel.startsWith(ALLOWED_PREFIX)) {
      throw new Error('channel not allowed');
    }
    return ipcRenderer.invoke(channel, ...args);
  },
});
```

比全量暴露好，但参数仍然任意，且通道清单在渲染侧可见。**正规项目还是用语义化 API**。

### 4. 配套防御

白名单桥接之外，主进程侧仍要做参数校验（纵深防御，见「渲染进程伪造 IPC 消息怎么防」）——因为：
- XSS 脚本可以"合法"调用 `api.file.pick()` 这类 API
- 桥接层防的是"通道越权"，主进程校验防的是"参数作恶"

### 5. 审查清单

code review 时搜 preload 里的危险模式：
```
grep -n "ipcRenderer" src/preload/
```
每处出现检查：
- [ ] 通道名是否硬编码（不是参数传入）
- [ ] 参数是否做了约束/校验
- [ ] 暴露的 API 是否最小必要

## 面试话术

> 完整 ipcRenderer 暴露等于把主进程所有通道开放给页面（含 XSS 脚本），权限边界归零。正确做法是 contextBridge 暴露语义化白名单 API：通道名收敛在 preload、一个 API 一件事、参数固定或严格校验、订阅类返回取消函数。桥接防通道越权，主进程参数校验防参数作恶，两层配合。

## 常见追问

- **contextIsolation 都开了，页面怎么"拿到"桥接 API 作恶？** 桥接 API 本来就是给页面用的，恶意脚本可以合法调用——所以 API 设计要保证"即使被恶意调用也干不了坏事"。
- **怎么防止页面篡改 window.api？** 主世界的 window.api 页面端确实可以覆盖（`window.api = {}`），但这只能骗页面自己，影响不到隔离世界里真实的桥。真正要防的是恶意代码**调用** API，不是篡改。

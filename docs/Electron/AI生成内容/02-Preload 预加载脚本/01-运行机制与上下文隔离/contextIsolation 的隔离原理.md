# contextIsolation 开启后 preload 和页面是什么关系？隔离原理是什么？

## 考察点

- V8 isolated world 的底层机制
- 隔离后还能操作同一个 DOM 的原因

## 参考答案

### 1. 隔离的本质：V8 的 Isolated World

contextIsolation 利用的是 V8/Chromium 的 **isolated world** 机制（Chrome 扩展 content script 同款）：

- 同一个页面中可以存在多个 **world**（JS 执行环境）
- 每个 world 有**独立的全局对象、独立的原型链、独立的内置对象**
- 所有 world 共享**同一个 DOM 树、同一个 document**

```
页面（主世界 Main World）        preload（隔离世界 Isolated World）
window ────────────────        window ────────────────
  ├─ Array (原型链 A)            ├─ Array (原型链 B)
  ├─ 页面定义的全局变量             ├─ ipcRenderer 等
  └─ ❌ 互相访问不到               └─ ❌ 互相访问不到
        └────────── 同一个 document/DOM ──────────┘
```

### 2. 隔离带来的效果

**（1）全局对象互不可见**

```js
// 页面 JS
window.mySecret = 'page-data';

// preload 中
console.log(window.mySecret); // undefined —— 看不到页面的全局
```

**（2）原型链独立，无法互相污染**

页面改写 `Array.prototype.push` 不影响 preload 使用的 Array——防止恶意页面通过原型污染攻击 preload 逻辑。

**（3）DOM 共享**

```js
// preload 里操作的就是页面的 DOM
document.getElementById('app').innerHTML; // 正常工作
```

DOM 是 C++ 层对象，跨 world 暴露同一个引用（V8 会为同一 DOM 对象在不同 world 创建各自的 JS 包装器，但指向同一底层节点）。

### 3. 那页面怎么拿到 preload 的能力？—— contextBridge

隔离之后页面无法直接读 preload 的变量，唯一的官方通道是 `contextBridge.exposeInMainWorld`：

```js
// preload：从隔离世界向主世界"摆渡"数据
contextBridge.exposeInMainWorld('api', {
  saveFile: (data) => ipcRenderer.invoke('file:save', data),
});
```

原理：contextBridge 在两个 world 之间建立受控通道，把值**按结构化克隆序列化**拷贝到主世界。函数会被包装成代理，调用时切回隔离世界执行。

### 4. 历史变迁（面试加分项）

- Electron 12 之前默认 `contextIsolation: false`：preload 和页面共享全局，页面可以直接读 preload 里 require 的 ipcRenderer——**等于页面白拿 Node 通信能力**，巨大安全隐患
- Electron 12 起默认 true：大量老项目升级后 `window.xxx` undefined 白屏——升级事故高发点

### 5. 关闭 contextIsolation 的代价

```js
// contextIsolation: false 时
// preload 里：
const { ipcRenderer } = require('electron');
window.ipcRenderer = ipcRenderer; // 页面直接可用
```

页面 JS 可以：
- 调用任意 IPC 通道（包括不该暴露的）
- 篡改 preload 注入的函数（Hook `window.api.saveFile` 窃取数据）
- 原型污染影响 preload 逻辑

### 6. 一句话总结

> contextIsolation 用 V8 isolated world 把 preload 和页面放进"同一 DOM、两个 JS 宇宙"：全局隔离、原型隔离、DOM 共享，二者唯一的合法通道是 contextBridge 的受控序列化摆渡。

## 常见追问

- **隔离后怎么调试 preload？** DevTools Console 左上角上下文切换器可从 "top"（主世界）切到 preload 的 isolated world。
- **隔离有性能开销吗？** 有少量（world 创建、contextBridge 序列化），但相比安全收益可忽略。
- **webFrame.executeJavaScript 在哪个 world？** 可以指定 worldId 在隔离世界执行（`webFrame.MAIN_WORLD_ID` / `ISOLATED_WORLD_ID` 相关 API）。

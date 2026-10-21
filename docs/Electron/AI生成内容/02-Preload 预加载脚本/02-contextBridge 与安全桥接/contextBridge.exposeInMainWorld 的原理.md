# contextBridge.exposeInMainWorld 的原理？什么数据能传、什么不能传？

## 考察点

- contextBridge 的跨 world 数据传递机制
- 结构化克隆的类型限制

## 参考答案

### 1. 基本用法回顾

```js
// preload（隔离世界）
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getUser: (id) => ipcRenderer.invoke('user:get', id),
  version: '1.0.0',
});
```

```js
// 页面（主世界）
const user = await window.api.getUser('u123');
```

### 2. 原理：跨 world 的序列化摆渡

两个 world 内存不共享，contextBridge 做的是：

```
隔离世界对象 → 边界检查/转换 → 主世界创建对应代理对象
```

具体行为按数据类型分三类：

**（1）原始值（string/number/boolean/null/undefined）**：直接拷贝。

**（2）普通对象/数组**：**深拷贝**（结构化克隆语义）到主世界，两边是完全独立的对象。

```js
// 暴露后页面改 obj.a 不影响 preload 侧原对象
contextBridge.exposeInMainWorld('config', { nested: { a: 1 } });
```

**（3）函数**：不能拷贝，创建**代理函数**。
- 主世界调用 `window.api.getUser()` 时，实际切换回隔离世界执行真实函数
- 参数从主世界克隆进隔离世界，返回值/异常再克隆回主世界
- 所以函数调用有**双向序列化开销**

### 3. 能传什么 / 不能传什么

| 类型 | 支持？ | 说明 |
|------|--------|------|
| 原始类型 | ✅ | |
| 普通对象/数组 | ✅ | 深拷贝，嵌套可以 |
| Function | ✅ | 变成代理函数 |
| Promise | ✅ | 桥接 Promise 会代理化，resolve 值再克隆 |
| Error | ⚠️ | 只保留 message，自定义属性丢失 |
| Date / RegExp / Map / Set | ⚠️ | 结构化克隆本身支持，但跨桥场景建议只传纯数据 |
| **DOM 节点** | ❌ | 传不过去（Node 不可克隆） |
| **class 实例（带方法）** | ⚠️ | 方法会丢，只剩数据属性——退化成普通对象 |
| Symbol / BigInt 以外特殊内置 | ❌ | |
| **Electron/Node 对象**（如 ipcRenderer 本身） | ❌ | 绑定型 API 对象不可克隆 |

### 4. 经典坑

**（1）直接暴露 ipcRenderer 失败**

```js
// ❌ TypeError: 绑定型对象无法克隆
contextBridge.exposeInMainWorld('ipc', ipcRenderer);
```

**（2）暴露 class 实例丢方法**

```js
class UserService {
  getName() { return 'xxx'; }
}
// ❌ 页面拿到的是 { } —— 方法丢失
contextBridge.exposeInMainWorld('service', new UserService());
```

**（3）Error 信息丢失**

```js
// preload 抛出自定义错误
throw Object.assign(new Error('boom'), { code: 'E_PERM' });
// 页面 catch 到的 Error 只有 message='boom'，code 丢了
// ✅ 正确：返回错误对象而不是 throw
return { ok: false, code: 'E_PERM', message: 'boom' };
```

**（4）冻结问题**
暴露的对象页面可以修改（拷贝后的），但可以用 `Object.freeze` 在暴露前冻结防止页面端误改本地副本——更重要的是理解**改不改都不影响 preload 侧**。

### 5. 性能提示

每次调用暴露的函数 = 参数克隆 + 跨 world 调度 + 返回值克隆。高频调用场景（如每帧调用）要避免走 contextBridge，设计为低频批量 API。

### 6. exposeInIsolatedWorld

还有个兄弟 API `exposeInIsolatedWorld(worldId, key, value)`：把值暴露到指定 world（比如 webview 内的 world），主世界页面反而拿不到——做更精细的可见性控制。

## 面试话术

> contextBridge 在两个 world 之间做受控摆渡：原始值拷贝、普通对象深拷贝、函数生成代理（调用时双向克隆）。不能传 DOM 节点、绑定型原生对象、带方法的 class 实例；Error 只剩 message。所以桥接 API 的设计准则是"纯数据进、纯数据出，错误用对象返回而不是 throw"。

## 常见追问

- **暴露的函数里的 this 是什么？** 代理调用时 this 会被忽略/置空，依赖 this 的方法要先 bind。
- **能暴露 getter 吗？** 对象的属性描述符行为有限，动态值建议暴露函数而不是属性。

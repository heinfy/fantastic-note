# contextBridge 暴露异步函数时有哪些序列化的坑？

## 考察点

- 跨 world Promise/Error/复杂对象的序列化行为
- 实战经验（这些坑都只在运行时出现）

## 参考答案

### 1. Promise 可以传，但 resolve 值要可克隆

```js
// preload
contextBridge.exposeInMainWorld('api', {
  getUser: (id) => ipcRenderer.invoke('user:get', id),
});
```

页面 `await window.api.getUser('1')` 能正常工作——contextBridge 会把隔离世界的 Promise 代理到主世界。但 **resolve 的值要经过结构化克隆**：

```js
// preload：返回 class 实例
getUser: async () => {
  return new User('张三'); // class 实例
};
// 页面拿到的是 { name: '张三' } —— 方法全部丢失，退化为普通对象
```

**准则：IPC/桥接链路上只传纯数据（DTO），领域对象在各自的进程内重建。**

### 2. Error 序列化：只剩 message

```js
// preload / 主进程抛出
throw Object.assign(new Error('权限不足'), { code: 'E_PERM', status: 403 });

// 页面 catch 到的：
err.message; // '权限不足' ✅
err.code;    // undefined ❌ 自定义属性丢失
err.stack;   // 不可靠/可能被清理
```

**正确做法：错误用对象返回，不用 throw**

```js
// preload 统一包装返回结构
call: async (fn) => {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    // 错误信息以纯数据形式回传
    return { ok: false, code: err.code || 'E_UNKNOWN', message: err.message };
  }
},
```

### 3. 大对象的序列化开销

桥接调用 = 参数克隆 + 返回值克隆，双向成本：

```js
// ❌ 一次传 50MB 数据过 bridge
getBigData: () => ipcRenderer.invoke('data:get-all'),

// ✅ 分页/摘要传输，完整数据走其他通道（文件/本地 HTTP）
getDataPage: (page, size) => ipcRenderer.invoke('data:get-page', page, size),
```

经验值：几 MB 以内的对象感知不强，几十 MB 开始明显卡顿，且**两端进程都卡**（克隆阻塞两边 JS 线程）。

### 4. 特殊类型的行为

| 类型 | 跨桥行为 |
|------|---------|
| `Date` | 结构化克隆支持，但建议统一用 ISO 字符串（时区歧义少） |
| `Map` / `Set` | 克隆支持，但团队习惯上多用普通对象/数组 |
| `ArrayBuffer` | 支持，且可用 transfer 优化（但 contextBridge 场景受限） |
| `undefined` 在数组/对象中 | 数组里变 null、对象里键消失（序列化语义） |
| 循环引用对象 | 直接抛错 |
| Function | 不能作为数据传（只有顶层暴露的函数会被代理） |

### 5. 回调函数传不下去

```js
// ❌ 页面想传回调给 preload
window.api.watch(config, (val) => console.log(val));
// 普通对象字段里的函数不能跨桥克隆——只有 exposeInMainWorld 顶层函数才有代理能力
```

正确模式：**订阅返回取消函数**（listener 注册在 preload 侧，页面只传一个回调给"订阅 API"）：

```js
// preload
onConfigChange: (callback) => {
  // callback 是主世界函数的代理，preload 侧可调用
  const listener = (_e, val) => callback(val);
  ipcRenderer.on('config:changed', listener);
  return () => ipcRenderer.removeListener('config:changed', listener);
},
```

### 6. 实战经验总结

1. 桥接 API 的入参出参**只用 JSON 可表达的结构**（对象/数组/字符串/数字/布尔/null），这是最安全的心智模型
2. 错误统一 `{ ok, code, message }` 结构，不依赖 Error 序列化
3. 大数据走旁路（文件/HTTP/MessagePort），桥只传引用
4. 暴露 API 时写好 TS 类型，类型层面就禁掉不可序列化的结构

## 面试话术

> 核心心智模型：桥接层是"JSON 语义"的——Promise 能代理但 resolve 值要可克隆；Error 只剩 message 所以用对象返回错误；class 实例退化为纯数据；回调传不下去要用订阅模式；大对象双向克隆两头卡，走旁路。把桥接 API 的入出参约束在 JSON 可表达范围内能避开 90% 的坑。

## 常见追问

- **ArrayBuffer 传大文件行不行？** 结构化克隆对 ArrayBuffer 友好（可 transfer），但 contextBridge 的代理链路不支持 transfer 语义，大文件还是走文件系统/HTTP 更合适。
- **同步函数和异步函数暴露有区别吗？** 同步函数跨桥调用会阻塞等结果（且 contextBridge 同步调用开销大），原则上一律设计为异步。

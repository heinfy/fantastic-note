# 如何封装一套类型安全的 IPC？（TS 方向，7 年经验必考）

## 考察点

- TypeScript 高级类型能力
- IPC 层的工程化设计（可维护性、防错）

## 参考答案

### 1. 痛点

裸用 `invoke('get-user', id)` 的问题：
- channel 是魔法字符串，写错编译期不报错，运行时才暴露
- 参数、返回值类型全靠口头约定
- 主进程 handler 和渲染侧调用没有类型关联，改了一端另一端不报错

### 2. 核心设计：通道注册表

用一个集中类型表定义所有通道的**入参和出参**：

```ts
// shared/ipc-channels.ts —— 主进程和渲染进程共享的类型契约
export interface IpcInvokeMap {
  'user:get': { args: [userId: string]; return: User };
  'user:list': { args: [page: number, size: number]; return: User[] };
  'file:download': { args: [url: string, savePath: string]; return: { taskId: string } };
  'app:quit': { args: []; return: void };
}

// 推送类事件（主进程 -> 渲染进程）单独定义
export interface IpcEventMap {
  'task:progress': { taskId: string; percent: number };
  'user:logout': null;
}
```

### 3. 渲染侧：类型安全的 invoke 封装

```ts
// renderer/api.ts
import type { IpcInvokeMap, IpcEventMap } from '../shared/ipc-channels';

// 泛型约束：channel 必须是注册表里的 key
export function invoke<C extends keyof IpcInvokeMap>(
  channel: C,
  ...args: IpcInvokeMap[C]['args'] // 入参类型自动推导
): Promise<IpcInvokeMap[C]['return']> { // 返回值类型自动推导
  return window.ipcRenderer.invoke(channel, ...args);
}

// 类型安全的订阅
export function subscribe<C extends keyof IpcEventMap>(
  channel: C,
  callback: (payload: IpcEventMap[C]) => void
): () => void {
  const listener = (_e: unknown, payload: IpcEventMap[C]) => callback(payload);
  window.ipcRenderer.on(channel, listener);
  return () => window.ipcRenderer.removeListener(channel, listener);
}
```

调用处获得完整类型检查：

```ts
const user = await invoke('user:get', 'u123'); // ✅ user 类型为 User
await invoke('user:get', 123);                 // ❌ 编译报错：入参类型不符
await invoke('user:unknown');                  // ❌ 编译报错：通道不存在
```

### 4. 主进程：handler 注册同样受类型约束

```ts
// main/ipc.ts
import { ipcMain } from 'electron';
import type { IpcInvokeMap } from '../shared/ipc-channels';

// 注册函数：handler 的签名必须匹配注册表
export function handle<C extends keyof IpcInvokeMap>(
  channel: C,
  handler: (
    event: Electron.IpcMainInvokeEvent,
    ...args: IpcInvokeMap[C]['args']
  ) => Promise<IpcInvokeMap[C]['return']> | IpcInvokeMap[C]['return']
) {
  ipcMain.handle(channel, handler);
}

// 业务层注册：类型自动校验
handle('user:get', async (e, userId) => {
  return await userService.get(userId); // 返回值类型不符会编译报错
});
```

### 5. 加分设计

**（1）preload 层也吃同一份类型表**
preload 里暴露的桥接 API 直接用 `IpcInvokeMap` 生成类型声明，渲染侧甚至不需要知道 channel 的存在，只调用语义化方法：

```ts
// preload 暴露语义化 API，类型从注册表派生
contextBridge.exposeInMainWorld('api', {
  getUser: (id: string) => ipcRenderer.invoke('user:get', id),
});
```

**（2）运行时校验**
类型只在编译期有效，渲染进程传入的运行时数据仍需校验（防伪造），handler 入口用 zod 之类的库做参数 Schema 校验，编译期 + 运行时双保险。

**（3）channel 命名规范**
`域:动作`（如 `user:get`、`file:download`），便于排查和按域拆分注册模块。

## 面试话术

> 核心思路是"契约先行"：shared 目录下的通道注册表作为唯一事实源，渲染侧 invoke、主进程 handle、preload 桥接三处全部从同一份类型表派生。调用处写错通道名、入参出参不符全部在编译期暴露。运行时再加 zod 校验防伪造 IPC。

## 常见追问

- **ts 项目和 js 项目混用怎么办？** 至少给 js 侧生成 d.ts；或注册表本身写成 JSON Schema，运行时同时用于校验和类型生成。
- **如何处理 handler 抛错的类型？** 定义统一错误结构 `{ code, message }`，return 类型写成 `Result<T>` 联合类型而不是 throw。

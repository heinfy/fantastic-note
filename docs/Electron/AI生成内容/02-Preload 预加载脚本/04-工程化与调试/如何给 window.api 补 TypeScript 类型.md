# 如何给 window.api 补上 TypeScript 类型？

## 考察点

- 渲染进程看不到 preload 的实现类型
- 声明文件写在哪、和真实桥保持一致

## 参考答案

### 1. 为什么要单独声明

preload 和页面是两个编译环境。页面里的 `window` 默认没有 `api`。把 preload 的 ts 文件 import 进页面，要么编译失败，要么把 Node 代码打进页面包。

类型用一份渲染进程能看见的 `d.ts`，不 import preload 源码。

### 2. 声明

```ts
// src/renderer/env.d.ts
export interface AppApi {
  getVersion: () => Promise<string>;
  minimize: () => void;
  // 订阅必须把取消函数写进类型，调用方才不会忘
  onProgress: (callback: (payload: { percent: number }) => void) => () => void;
}

declare global {
  interface Window {
    api: AppApi;
  }
}

export {};
```

`tsconfig` 的 `include` 要盖住这个文件。页面里 `window.api.getVersion()` 就能得到 `Promise<string>`。

### 3. 和 preload 对齐

preload 里暴露的对象手写一份实现，类型从同一份 `AppApi` 导入做检查：

```ts
// preload.ts
import type { AppApi } from '../renderer/env';

const api: AppApi = {
  getVersion: () => ipcRenderer.invoke('app:version'),
  minimize: () => ipcRenderer.send('window:min'),
  onProgress: (callback) => {
    const listener = (_event: unknown, payload: { percent: number }) => callback(payload);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
};

contextBridge.exposeInMainWorld('api', api);
```

这样少一个函数、多一个参数，都是编译错误。运行时 contextBridge 仍不会自动校验，主进程 handler 里还要校验参数。

### 4. 多窗口

设置窗口没有 `getVersion` 以外的能力时，不要给它同一份 `Window['api']`。可以分成 `MainWindowApi` 和 `SettingsWindowApi`，页面入口各自引用，避免设置页“类型上能调、运行时没有”。

## 面试话术

> window.api 的类型写在渲染进程的 d.ts 里，用 declare global 扩 Window，不从 preload 源码 import。preload 实现标成同一份接口，两边漏改会编译失败。不同窗口的能力不同，就拆不同的接口，而不是一个大接口全是可选方法。

## 常见追问

- **能从频道表自动生成这份接口吗？** 可以。频道多了以后用一份共享类型生成 invoke 和 d.ts，避免三处手写。生成结果仍要人看有没有把高权限频道漏进页面。
- **contextBridge 会改函数签名吗？** 类型上仍是你声明的函数。运行时参数和返回值要可结构化克隆，类型系统不会帮你检查这一点，所以接口里不要写 DOM 节点或类实例。

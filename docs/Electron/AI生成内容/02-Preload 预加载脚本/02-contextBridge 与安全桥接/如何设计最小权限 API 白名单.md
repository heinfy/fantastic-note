# 如何设计一个最小权限的桥接 API？参数校验怎么做？

## 考察点

- 桥接层的架构设计能力
- "假设调用方是恶意的"的安全设计思维

## 参考答案

### 1. 设计原则

> 每一条暴露的 API，都假设它会被恶意脚本以最坏的方式调用。

四条原则：
1. **能力最小化**：页面需要什么就只给什么，多一点都不给
2. **语义化命名**：API 表达业务意图，不暴露通道/路径/shell 等系统语义
3. **参数收敛**：能枚举不自由文本，能传 id 不传路径
4. **只读数据冻结**：暴露的静态数据 freeze，防止篡改本地副本

### 2. 按业务域分组组织

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// 静态数据：冻结后暴露
const appInfo = Object.freeze({
  version: process.env.APP_VERSION,
  platform: process.platform,
});

const api = {
  app: appInfo,

  // 用户域：只给当前用户信息，不给用户管理
  user: {
    getCurrent: () => ipcRenderer.invoke('user:get-current'),
    logout: () => ipcRenderer.send('user:logout'),
  },

  // 窗口域：只给控制操作
  window: {
    minimize: () => ipcRenderer.send('window:min'),
    toggleMaximize: () => ipcRenderer.send('window:toggle-max'),
    close: () => ipcRenderer.send('window:close'),
  },

  // 任务域：id 化参数 + 订阅模式
  task: {
    start: (taskId) => {
      // 参数校验：taskId 必须是合法格式
      if (!/^[a-z0-9-]{8,36}$/.test(taskId)) {
        return Promise.reject(new Error('invalid taskId'));
      }
      return ipcRenderer.invoke('task:start', taskId);
    },
    onProgress: (callback) => {
      // 回调参数也做过滤，只给页面需要的字段
      const listener = (_e, { taskId, percent }) => {
        callback({ taskId, percent });
      };
      ipcRenderer.on('task:progress', listener);
      return () => ipcRenderer.removeListener('task:progress', listener);
    },
  },
};

contextBridge.exposeInMainWorld('api', api);
```

### 3. 反例 vs 正例对照

| ❌ 危险设计 | ✅ 安全设计 | 原因 |
|------------|------------|------|
| `readFile(path)` | `readTemplate(name)` | 路径任意 = 任意文件读取；名称枚举只能读模板目录 |
| `exec(cmd)` | `openLogFolder()` | 任意命令 = RCE；具体操作无注入面 |
| `openWindow(url)` | `openHelpPage()` | 任意 URL 可加载钓鱼页 |
| `invoke(channel, ...args)` | 语义化方法 | 万能桥 = 全通道暴露 |
| `getConfig()` 返回全部配置 | `getTheme()` 只回主题 | 配置里可能有敏感字段（token/路径） |

### 4. 参数校验的三个层次

```js
// 层次一：类型与格式（preload 层）
if (typeof taskId !== 'string' || !/^[\w-]+$/.test(taskId)) {
  throw new Error('invalid taskId');
}

// 层次二：枚举白名单
const ALLOWED_ACTIONS = ['start', 'stop', 'pause'];
if (!ALLOWED_ACTIONS.includes(action)) {
  throw new Error('unknown action');
}

// 层次三：主进程侧再校验（zod schema，防桥被绕过）
// preload 校验是体验层，主进程校验是安全层，两层都要有
```

### 5. 返回值过滤

主进程返回的数据可能含敏感字段，preload 做"出站过滤"：

```js
// 主进程返回完整任务对象，页面只需要部分字段
getTask: async (taskId) => {
  const task = await ipcRenderer.invoke('task:get', taskId);
  // 只取页面需要的字段，内部路径、凭据等不下发
  return { id: task.id, name: task.name, status: task.status };
},
```

### 6. TypeScript 加持

桥接 API 的类型定义与渲染进程共享，页面调用获得完整类型提示，同时类型即文档（哪些 API 可用一目了然）：

```ts
// shared/api.d.ts
export interface BridgeApi {
  user: {
    getCurrent(): Promise<User>;
    logout(): void;
  };
  task: {
    start(taskId: string): Promise<void>;
    onProgress(cb: (p: TaskProgress) => void): () => void;
  };
}

declare global {
  interface Window {
    api: BridgeApi;
  }
}
```

## 面试话术

> 最小权限设计四原则：能力最小化、语义化、参数收敛（id 化/枚举化）、返回值过滤。组织上按业务域分组，静态数据冻结。校验分两层：preload 做格式校验（体验），主进程做 schema 校验（安全），并且假设桥接 API 会被恶意调用来设计每条 API 的最坏影响面。

## 常见追问

- **API 越来越多不好维护怎么办？** 按域拆 preload 模块，构建时合并；用代码生成从通道注册表自动生成桥接骨架，人工只写校验逻辑。
- **页面需要的能力确实很多很杂怎么办？** 这是坏味道的信号——说明渲染进程承担了本该主进程做的事。重新划分职责，而不是扩大桥接面。

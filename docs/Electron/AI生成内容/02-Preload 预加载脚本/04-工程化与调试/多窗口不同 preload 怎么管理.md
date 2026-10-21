# 多窗口使用不同 preload 怎么管理？公共逻辑怎么复用？

## 考察点

- 多窗口架构下 preload 的组织方式
- 公共桥与业务桥的拆分复用

## 参考答案

### 1. 场景

```
主窗口（main）    → 需要完整业务 API
设置窗口（settings）→ 只需要配置读写 API
日志窗口（log）    → 只需要日志订阅 API
关于窗口（about）  → 只需要版本信息
```

如果所有窗口共用一个"全家桶 preload"：小窗口白拿了不需要的能力（违背最小权限），且 preload 体积膨胀。

### 2. 基本方式：每个窗口指定自己的 preload

```js
// 主窗口
new BrowserWindow({
  webPreferences: { preload: path.join(__dirname, 'preload-main.js') },
});

// 设置窗口
new BrowserWindow({
  webPreferences: { preload: path.join(__dirname, 'preload-settings.js') },
});
```

### 3. 公共逻辑复用：分层组合

**（1）源码分层**

```
preload/
├── bridge/                 # 公共桥接层
│   ├── base.ts            # 通用 API（窗口控制、主题、版本）
│   └── ipc.ts             # 类型安全 invoke 封装
├── preload-main.ts        # 主窗口：base + 业务全量
├── preload-settings.ts    # 设置窗口：base + 配置 API
└── preload-log.ts         # 日志窗口：base + 日志订阅
```

```ts
// bridge/base.ts —— 公共部分抽成函数
import { contextBridge, ipcRenderer } from 'electron';

// 暴露公共 API，各 preload 入口调用
export function exposeBaseApi() {
  contextBridge.exposeInMainWorld('baseApi', {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    window: {
      minimize: () => ipcRenderer.send('window:min'),
      close: () => ipcRenderer.send('window:close'),
    },
  });
}
```

```ts
// preload-settings.ts —— 组合：公共 + 本窗口专属
import { exposeBaseApi } from './bridge/base';
import { contextBridge, ipcRenderer } from 'electron';

exposeBaseApi(); // 复用公共桥

contextBridge.exposeInMainWorld('settingsApi', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config:save', cfg),
});
```

**（2）构建多入口**

```js
// vite/webpack 多入口配置，每个 preload 独立打包
export default {
  build: {
    rollupOptions: {
      input: {
        'preload-main': 'src/preload/preload-main.ts',
        'preload-settings': 'src/preload/preload-settings.ts',
        'preload-log': 'src/preload/preload-log.ts',
      },
    },
  },
};
```

每个入口独立 bundle，公共代码被各自内联（preload 体积小，重复打包可接受）。

### 4. 权限最小化视角的收益

| 窗口 | 拿到的能力 | 被 XSS 后的最坏情况 |
|------|-----------|-------------------|
| 关于窗口 | 版本号 | 几乎无损失 |
| 设置窗口 | base + 配置读写 | 配置被篡改 |
| 主窗口 | 完整 API | 看主窗口桥接设计 |

**每个窗口的 preload 就是它的事故半径**——多 preload 拆分本质是按窗口做权限隔离。

### 5. 高级：session 级与 webContents 级补充

- `webPreferences.preload` 是窗口级唯一入口
- 内嵌 webview 可以有自己的 preload（`webview` 标签的 `preload` 属性），与宿主窗口独立
- 没有"session 级 preload"的官方概念，但可以在 `web-contents-created` 事件里对新建的 webContents 统一 `executeJavaScript` 注入兜底逻辑

### 6. 工程注意点

1. **preload 路径在打包后要正确**：多入口产物都要打进 asar 并正确引用（构建配置 review）
2. **类型声明同步**：每个 preload 暴露的 window 全局（baseApi/settingsApi）要有对应 d.ts，渲染侧按窗口引入类型
3. **公共桥的变更影响面**：改 base.ts 影响所有窗口，变更后全窗口回归
4. **数量控制**：preload 入口不宜过多（3-6 个合理），太多说明窗口职责划分有问题

## 面试话术

> 多 preload 的本质是按窗口做权限隔离——每个窗口只拿到它需要的能力，事故半径可控。工程上用"公共桥 + 业务桥"分层：base 模块抽公共 API，各 preload 入口组合后由构建工具多入口独立打包。同时注意 d.ts 类型同步和打包后路径正确性。

## 常见追问

- **能不能一个 preload 按 URL 判断暴露不同 API？** 技术上可以（读 location 判断），但把路由逻辑混进 preload 不如构建期拆分干净——运行期判断也意味着代码全量下发到每个窗口。
- **渲染进程怎么知道当前窗口有哪些 API？** 检测 `window.xxxApi` 是否存在（特性检测），TS 侧按窗口类型声明。

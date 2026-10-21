# webPreferences

`webPreferences` 是创建 `BrowserWindow` 或 `WebContentsView` 时的网页配置。它决定这份网页有没有 Node、预加载脚本是哪一个、使用哪份 session。

文档位于 BrowserWindow 的选项说明中。

## 最常出现的字段

| 字段 | 默认倾向 | 含义 |
|------|----------|------|
| `preload` | 无 | 预加载脚本的绝对路径 |
| `nodeIntegration` | `false` | 页面能否直接使用 Node |
| `contextIsolation` | `true`（自 Electron 12） | 预加载脚本与页面是否分属不同 JS 世界 |
| `sandbox` | `true`（自 Electron 20） | 渲染进程是否进入操作系统沙箱 |
| `webSecurity` | `true` | 是否启用同源策略等网页安全检查 |
| `partition` | 默认 session | 选择存储和网络分区 |
| `webviewTag` | `false` | 是否允许页面使用 `<webview>` |
| `devTools` | `true` | 是否允许打开开发者工具 |
| `backgroundThrottling` | `true` | 窗口被挡住时是否降低定时器和动画频率 |

`nodeIntegration: true` 会关闭沙箱。关闭 `contextIsolation` 也会关闭沙箱。

## 相关文档

- [术语-nodeIntegration](./术语-nodeIntegration.md)
- [概念-沙箱](./概念-沙箱.md)
- [概念-上下文隔离](./概念-上下文隔离.md)

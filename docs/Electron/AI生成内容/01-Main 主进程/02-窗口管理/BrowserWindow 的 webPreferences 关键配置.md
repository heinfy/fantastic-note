# BrowserWindow 的 webPreferences 关键配置项有哪些？安全影响是什么？

## 考察点

- 核心配置项的语义与默认值
- 安全配置意识（面试官真正想听的）

## 参考答案

### 关键配置项

| 配置 | 默认值（现代版本） | 说明 |
|------|------|------|
| `preload` | - | 预加载脚本路径，页面加载前注入 |
| `nodeIntegration` | `false` | 渲染进程能否直接用 Node API（require/fs） |
| `contextIsolation` | `true` | preload 与页面是否隔离 JS 上下文 |
| `sandbox` | `true`（无 preload 时） | 是否启用 Chromium 沙箱，限制系统调用 |
| `webSecurity` | `true` | 同源策略开关，**永远不要关** |
| `allowRunningInsecureContent` | `false` | https 页面能否加载 http 资源 |
| `webviewTag` | `false` | 是否启用 `<webview>` 标签 |
| `spellcheck` | `true` | 拼写检查 |
| `backgroundThrottling` | `true` | 窗口隐藏/最小化时是否降帧降频（agent 后台任务常需关闭） |
| `devTools` | `true` | 生产环境可禁用 |

### 推荐的安全基线

```js
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,     // 页面绝不直接接触 Node
    contextIsolation: true,     // 隔离页面与 preload 上下文
    sandbox: true,              // 能开就开
    webSecurity: true,
    allowRunningInsecureContent: false,
  },
});
```

原则：**页面能力最小化，能力通过 preload 白名单桥接**。

### 容易被追问的两个点

**1. `backgroundThrottling: false` 的典型场景**
agent 的窗口隐藏后，Chromium 默认会把页面渲染降到 1fps 甚至暂停 rAF/定时器。如果渲染进程里有依赖 rAF 或高频定时器的后台任务（如 WebGL 推流、canvas 动画心跳），需要关闭节流。但代价是后台 CPU 占用上升，更好的做法是把任务挪到主进程或 utility process。

**2. `sandbox` 与 preload 的联动**
`sandbox: true` 时 preload 只能用一个阉割版 require（仅 `electron`、`events` 等少数模块），不能 `require('fs')`。这是常见的"preload 里读文件报错"的原因。

## 面试话术

> 我配置 webPreferences 的第一原则是安全基线：nodeIntegration 关闭、contextIsolation 开启、能力全部走 preload 白名单桥接；第二才是按场景调整，比如 agent 后台任务关 backgroundThrottling。

## 常见追问

- **`webSecurity: false` 能用来解决跨域吗？** 能，但等于脱掉防弹衣，生产环境禁止。跨域问题应在主进程用 `net`/`webRequest` 解决。
- **`devTools: false` 就安全了吗？** 不，用户仍可通过快捷键/远程调试端口开 DevTools，安全不能依赖隐藏入口。

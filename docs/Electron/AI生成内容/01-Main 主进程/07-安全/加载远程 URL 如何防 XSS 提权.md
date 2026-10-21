# 加载远程 URL 时如何防止 XSS 提权？导航与弹窗怎么拦截？

## 考察点

- 远程内容的安全威胁模型（XSS → 桌面端提权链）
- will-navigate / setWindowOpenHandler 等拦截点

## 参考答案

### 1. 威胁模型：为什么桌面端 XSS 更可怕

浏览器里 XSS 的极限是窃取 cookie/发起请求；Electron 里如果安全配置不当，XSS 可以直接：
- 拿到 Node 能力执行系统命令（nodeIntegration 开启时）
- 通过暴露不当的桥接 API 调用特权 IPC
- 跳转到钓鱼页面伪装应用内界面

所以远程内容的第一原则是：**把它当作不可信内容，关进最严的笼子**。

### 2. 基础防线：远程内容用独立最严配置

```js
function openExternalWindow(url) {
  const win = new BrowserWindow({
    webPreferences: {
      // 远程页面：不给 preload、不给任何桥接能力
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // 独立的内存 session，不共享主应用的 cookie/storage
      partition: `external-${Date.now()}`,
    },
  });
  win.loadURL(url);
}
```

### 3. 导航拦截：will-navigate

防止页面跳转到非预期域名（钓鱼/挂马）：

```js
const ALLOWED_HOSTS = new Set(['app.example.com', 'docs.example.com']);

win.webContents.on('will-navigate', (event, url) => {
  const { host } = new URL(url);
  if (!ALLOWED_HOSTS.has(host)) {
    event.preventDefault(); // 阻止窗口内跳转
    shell.openExternal(url); // 交给系统浏览器打开
  }
});
```

### 4. 新窗口拦截：setWindowOpenHandler

远程页面 `window.open()` 或 `target="_blank"` 链接的处理：

```js
win.webContents.setWindowOpenHandler(({ url }) => {
  // 校验域名
  if (new URL(url).host.endsWith('example.com')) {
    return { action: 'allow' }; // 允许开新窗口
  }
  shell.openExternal(url); // 外部链接一律给系统浏览器
  return { action: 'deny' }; // 拒绝应用内打开
});
```

**重点**：旧代码里的 `new-window` 事件已废弃，必须用 `setWindowOpenHandler`——直接 `allow` 而不设置 override 配置，会继承父窗口的 webPreferences，相对安全。

### 5. webview 的防护

```js
// 拦截任何试图 attach webview 的行为
app.on('web-contents-created', (e, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // 强制收紧 webview 的配置
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    // 校验 webview 加载的 src
    if (!params.src.startsWith('https://trusted.example.com/')) {
      event.preventDefault();
    }
  });
});
```

### 6. 纵深防御清单

| 层 | 措施 |
|----|------|
| 配置 | 远程内容独立 session + 最严 webPreferences + 无 preload |
| 导航 | will-navigate 域名白名单，外部链接 shell.openExternal |
| 弹窗 | setWindowOpenHandler 白名单 |
| 内容 | CSP 响应头（`default-src 'self'`），禁用内联脚本 |
| 证书 | `certificate-error` 事件默认拒绝，不自作聪明放行 |
| 输入 | 远程页面的数据进本地 UI 时按文本渲染，禁 v-html/innerHTML |

### 7. 典型错误示范（面试可主动举）

```js
// ❌ 为了"方便"放行所有证书错误
app.on('certificate-error', (event, url, error, cert, callback) => {
  event.preventDefault();
  callback(true); // 中间人攻击门户大开
});

// ❌ 远程页面和本地页面共用 preload（桥接 API 暴露给了远程内容）
win.loadURL('https://third-party.com'); // 但 webPreferences.preload 指向业务 preload
```

## 面试话术

> 远程内容的防护模型是"独立笼子 + 导航白名单"：独立内存 session、无 preload、最严三开关；will-navigate 和 setWindowOpenHandler 双层域名白名单，白名单外的链接一律 shell.openExternal 交给系统浏览器；webview 用 will-attach-webview 强制降级配置。原则是不可信内容永远不接触特权 API。

## 常见追问

- **OAuth 登录页（第三方域名）怎么处理？** 单独窗口 + 严格导航白名单（只放行 OAuth 域名），回调 URL 用自定义协议或 localhost 捕获。
- **远程内容确实需要部分桥接能力怎么办？** 用单独的"最小 preload"，只暴露必要 API，且 senderFrame URL 校验（见「伪造 IPC 消息」）。

# 自定义协议 protocol 怎么注册？有什么安全风险？

## 考察点

- protocol.handle 新 API 与特权 scheme 注册
- 路径穿越、deeplink 注入两大风险

## 参考答案

### 1. 两种"自定义协议"场景

Electron 里说的自定义协议分两类，面试要先分清：

- **应用内资源协议**：如 `myapp://static/index.html`，替代 file:// 加载本地资源
- **系统级 deeplink**：如 `myapp://open?id=1`，从浏览器/外部唤起应用

### 2. 应用内资源协议（现代写法）

```js
// 第一步：必须在 app ready 之前注册特权 scheme
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'myapp',
    privileges: {
      standard: true,        // 符合 URL 标准解析
      secure: true,          // 等同 https 的安全上下文
      supportFetchAPI: true, // 允许 fetch 加载
      corsEnabled: true,
      stream: true,          // 支持流式响应（音视频）
    },
  },
]);

// 第二步：ready 后注册处理器
app.whenReady().then(() => {
  protocol.handle('myapp', (request) => {
    const url = new URL(request.url);
    // 映射到本地文件
    const filePath = path.join(__dirname, 'renderer', decodeURIComponent(url.pathname));
    return net.fetch(pathToFileURL(filePath).toString());
  });

  // 页面加载
  win.loadURL('myapp://static/index.html');
});
```

**API 变迁**：Electron 25+ 废弃了 `registerFileProtocol` / `registerStringProtocol` 等老式回调 API，统一到 `protocol.handle`（返回 Response，可流式）——这是升级高频考点。

### 3. 风险一：路径穿越（最经典）

```js
// ❌ 危险写法：直接拼接路径
protocol.handle('myapp', (request) => {
  const url = new URL(request.url);
  // 攻击者构造 myapp://static/../../../../etc/passwd
  return net.fetch(pathToFileURL(path.join(__dirname, url.pathname)).toString());
});
```

`url.pathname` 里的 `../` 经过 normalize 可能逃逸出预期目录，**把应用内协议变成任意文件读取接口**（页面 XSS 后读取用户任意文件）。

正确做法：解析后强制校验根目录前缀。

```js
const RENDERER_ROOT = path.join(__dirname, 'renderer');

protocol.handle('myapp', (request) => {
  const { pathname } = new URL(request.url);
  // resolve 后校验是否仍在根目录内
  const filePath = path.resolve(RENDERER_ROOT, '.' + decodeURIComponent(pathname));
  if (!filePath.startsWith(RENDERER_ROOT + path.sep)) {
    return new Response('forbidden', { status: 403 });
  }
  return net.fetch(pathToFileURL(filePath).toString());
});
```

### 4. 风险二：deeplink 参数注入

系统级协议注册：

```js
// 注册为 myapp:// 协议的处理者
app.setAsDefaultProtocolClient('myapp');
```

唤起方式：
- **macOS**：`app.on('open-url', (e, url) => ...)`（必须 `event.preventDefault()`）
- **Windows**：URL 作为命令行参数传入（结合单实例锁的 `second-instance` 解析 argv）

风险：协议 URL 完全由外部构造，**参数不可信**：

```js
function handleDeeplink(url) {
  const parsed = new URL(url);
  // ❌ 直接执行 parsed.pathname 对应的任意操作

  // ✅ 白名单路由 + 参数 Schema 校验
  const routes = {
    '/open-file': (params) => openFile(validateId(params.get('id'))),
    '/join-meeting': (params) => joinMeeting(validateId(params.get('id'))),
  };
  const handler = routes[parsed.pathname];
  if (handler) handler(parsed.searchParams);
}
```

典型攻击：`myapp://exec?cmd=rm -rf` 类设计（把 deeplink 当 RPC 用）等于给任何网页留了命令执行入口。

### 5. 其他注意点

1. **特权 scheme 必须在 ready 前注册**，否则不生效（常见 bug）
2. `secure: true` 让协议页面成为安全上下文（可用 crypto.subtle 等 API）
3. deeplink 唤起的窗口展示敏感操作前要求**用户二次确认**（协议参数可能来自钓鱼链接）
4. Windows 卸载时清理注册表里的协议注册（nsis 卸载钩子）

## 面试话术

> 资源协议用 registerSchemesAsPrivileged（ready 前）+ protocol.handle（ready 后），核心风险是路径穿越——resolve 后必须校验根目录前缀。deeplink 分平台处理（macOS open-url / Windows argv + second-instance），核心原则是参数不可信：白名单路由 + Schema 校验 + 敏感操作二次确认。

## 常见追问

- **file:// 加载本地资源有什么问题，为什么要自定义协议？** file:// 下 fetch/XHR 受限、CORS 特殊、相对路径在打包后易错；自定义协议可获得标准 URL 行为 + 安全上下文。
- **registerSchemesAsPrivileged 不调用会怎样？** scheme 按默认非标准处理，fetch、模块加载、localStorage 等一堆行为异常。

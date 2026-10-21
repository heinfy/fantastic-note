# 主进程发起网络请求用 net 模块还是 Node http/fetch？怎么选？

## 考察点

- Electron net 模块与 Node 网络栈的本质差异
- 代理、证书、CORS 等工程细节

## 参考答案

### 1. 两者的本质区别

| | Electron `net` 模块 | Node `http/https` / `fetch` |
|---|---|---|
| 底层 | Chromium 网络栈 | Node 网络栈（undici 等） |
| 系统代理 | **自动遵循**（含 PAC 脚本） | 默认不走系统代理 |
| 证书校验 | Chromium 的证书库与策略 | Node 的 CA 列表 |
| Cookie | 与 session 的 cookie jar 打通 | 自己管理 |
| CORS | 无（主进程没有同源限制） | 无 |
| 流式/底层控制 | 一般 | 强 |

### 2. 核心差异展开：系统代理（最重要的决策依据）

企业环境里用户常配系统代理或 PAC 自动代理脚本：
- `net.request` 会**自动按系统设置走代理**，行为与用户浏览器一致
- Node `http`/`fetch` **完全无视系统代理**，直连导致请求失败——这是 agent 在企业内网"浏览器能上网、agent 连不上"的经典原因

Node 侧要支持代理需要引入 `proxy-agent` / `undici ProxyAgent` 并自己解析系统代理设置（macOS scutil、Windows 注册表），很麻烦。

### 3. 选择建议

**用 `net` 模块的场景（默认推荐）**：
- 业务 API 请求、心跳上报——跟随用户系统代理，行为可预期
- 需要共享 session cookie 的请求（`net.request({ session })` 可以指定用哪个 session 的 cookie）

```js
const { net } = require('electron');

const request = net.request({
  method: 'POST',
  url: 'https://api.example.com/report',
  session: session.defaultSession, // 可选：关联 session 的 cookie
});

request.on('response', (response) => {
  let body = '';
  response.on('data', (chunk) => (body += chunk));
  response.on('end', () => console.log(JSON.parse(body)));
});
request.end(JSON.stringify(payload));
```

**用 Node http/fetch 的场景**：
- 访问**本地服务**（127.0.0.1，不该走代理——代理反而会拦截本地请求）
- 需要精细控制：连接池、keep-alive 参数、HTTP/2、原始 socket
- 大文件流式上传下载（Node Stream 生态成熟）
- 长连接 WebSocket（`ws` 库功能比 Chromium 侧在后台行为更可控）

### 4. 实践中的组合策略

agent 项目里我通常封装一个请求层：
- 默认走 `net`（跟随系统代理）
- 本地地址（127.0.0.1/localhost）自动切 Node fetch
- 大文件下载专用 Node stream 通道
- 请求层统一做：超时、重试、埋点、错误规范化

### 5. 注意点

1. `net` 模块只能在 **ready 之后**使用
2. `net.request` 不自动跟随重定向次数/策略与 fetch 略有差异，3xx 要自己处理或配置
3. Node 18+ 内置 fetch（undici），不再需要 node-fetch
4. 自签名证书的企业内网：net 走 Chromium 策略（`certificate-error` 事件处理），Node 用 `NODE_TLS_REJECT_UNAUTHORIZED` 或自定义 ca（生产慎用全局关闭）

## 面试话术

> 选择的核心依据是"要不要跟随用户的网络环境"：面向公网/企业的业务请求用 net 模块——自动系统代理、PAC、与 session cookie 打通；面向本地服务和需要流式精细控制的用 Node http/fetch。我在 agent 里封装了统一请求层按目标地址自动路由两套栈。

## 常见追问

- **渲染进程 fetch 和主进程 net 都会走代理吗？** 渲染进程 fetch 走 Chromium 网络栈，与 net 一样遵循代理。
- **WebSocket 怎么选？** 渲染进程 WebSocket 走 Chromium；主进程用 `ws` 库。主进程方案在窗口全关后仍能保活，agent 长连接推荐放主进程。

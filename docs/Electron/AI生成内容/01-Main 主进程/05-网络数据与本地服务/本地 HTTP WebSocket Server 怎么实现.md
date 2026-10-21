# 本地 HTTP/WebSocket Server（供浏览器插件/其他应用调用 agent）怎么实现？安全怎么保证？

## 考察点

- agent 本地服务的完整设计
- 本地服务安全：鉴权、DNS rebinding 防护（agent 岗核心考题）

## 参考答案

### 1. 场景与基本架构

agent 在 `127.0.0.1` 起本地服务，典型消费者：
- 浏览器扩展（网页唤起 agent 执行本地任务）
- CLI 工具 / 其他桌面应用
- 本机渲染进程（大文件流式传输）

```js
const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

// 启动时生成一次性 token，作为鉴权凭证
const authToken = crypto.randomBytes(32).toString('hex');

function startLocalServer() {
  const server = http.createServer((req, res) => {
    // 安全校验（见下文）
    if (!validateRequest(req)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    // 业务路由
    route(req, res);
  });

  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws, req) => {
    if (!validateRequest(req)) return ws.close(4001, 'unauthorized');
    // ws 业务处理
  });

  // 关键：只绑定回环地址，不暴露到局域网
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    writePortFile(port); // 端口告知消费者
  });
}
```

### 2. 四个关键设计点

**（1）端口：随机 + 约定文件交换**

固定端口会冲突，方案是监听随机端口（`listen(0)`），然后把端口写到约定位置：

```js
// 写到用户目录，消费者（浏览器扩展等）从这里读
fs.writeFileSync(
  path.join(app.getPath('userData'), 'agent-port'),
  JSON.stringify({ port, token: authToken }),
  { mode: 0o600 } // 仅当前用户可读，防其他用户窃取 token
);
```

**（2）鉴权：启动时生成 token**
- token 随每次启动重新生成，写入仅当前用户可读的端口文件
- 每个请求校验 `Authorization: Bearer <token>` 或自定义头
- 防止恶意网页直接 `fetch('http://127.0.0.1:port/敏感操作')`

**（3）防 DNS Rebinding（最容易被问倒的点）**

攻击原理：恶意网站把域名解析先指向自己服务器、再改成 127.0.0.1，绕过同源策略以域名身份请求你的本地服务。防护：**校验 Host 头**。

```js
function validateRequest(req) {
  // 1. Host 头必须是 127.0.0.1:port，拒绝任何域名形式
  const host = req.headers.host || '';
  if (!host.startsWith('127.0.0.1:') && !host.startsWith('localhost:')) {
    return false;
  }
  // 2. 校验 token
  const auth = req.headers['authorization'];
  if (auth !== `Bearer ${authToken}`) return false;
  return true;
}
```

**（4）Origin 校验（针对浏览器来源）**

浏览器跨域请求会带 `Origin` 头，配合 CORS 白名单：

```js
// 只允许我们自己的浏览器扩展
const ALLOWED_ORIGINS = new Set(['chrome-extension://abcdefghijk']);

const origin = req.headers.origin;
if (origin && !ALLOWED_ORIGINS.has(origin)) {
  res.writeHead(403);
  return res.end();
}
// 响应加 CORS 头，且只放行白名单 origin
res.setHeader('Access-Control-Allow-Origin', origin || '');
```

### 3. 生命周期管理

- 跟随主进程退出关闭：`app.on('will-quit', () => server.close())`
- 多实例防护：单实例锁天然保证服务只有一份
- 端口文件过期检测：消费者拿到端口后先探测（/health），失败说明 agent 未运行或已重启

### 4. 备选方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| HTTP + WebSocket on 127.0.0.1 | 通用，浏览器可直接访问 | 需处理 rebinding/CORS |
| Unix domain socket / Named pipe | 文件权限天然隔离，无网络面 | 浏览器无法访问，只适合本机进程间 |
| Native Messaging（浏览器扩展专用） | 浏览器扩展的标准方案，chrome 托管通道 | 只服务扩展场景，需注册 manifest |

如果消费者**只是浏览器扩展**，优先考虑 Native Messaging（浏览器扩展 ↔ 原生应用的标准通道，安全模型由浏览器保证）；需要网页或任意应用访问时才用本地 HTTP。

## 面试话术

> 本地服务的安全模型可以总结为四层：只绑 127.0.0.1（不暴露局域网）、启动级随机 token 鉴权（防恶意网页直接调用）、Host 头白名单（防 DNS rebinding）、Origin 白名单 + CORS（防浏览器跨站调用）。端口用随机端口 + 权限受控的端口文件交换。如果面向的只是浏览器扩展，Native Messaging 是更标准的解。

## 常见追问

- **恶意软件也在本机，读到端口文件怎么办？** 本机已沦陷则无解，本地服务的威胁模型是防"网页/远程攻击者"，不是防本机恶意进程（那是 OS 的事）。
- **怎么调试本地服务？** curl 带 Host 和 Authorization 头直接打；开发期可开关关闭校验（仅限 dev）。

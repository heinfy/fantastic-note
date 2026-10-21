# JSON-RPC 与 SSE 知识总结

## 一、JSON-RPC 是什么

**RPC 全称：Remote Procedure Call（远程过程调用）**——像调用本地函数一样调用远端服务。

**JSON-RPC 是一个轻量级的 RPC 协议**，核心思想：用 JSON 描述"调用哪个方法、传什么参数、返回什么结果"。

### 消息结构（2.0 版本，就三种）

```jsonc
// 1. Request（请求）：需要响应
{
  "jsonrpc": "2.0",
  "id": 1,                        // 请求标识，响应用它配对
  "method": "user.get",           // 方法名（动词）
  "params": { "userId": "u123" }  // 参数
}

// 2. Response（响应）：成功带 result，失败带 error
{
  "jsonrpc": "2.0",
  "id": 1,                        // 与请求 id 对应
  "result": { "name": "张三" }
}
// 或失败时：
{ "jsonrpc": "2.0", "id": 1, "error": { "code": -32601, "message": "Method not found" } }

// 3. Notification（通知）：没有 id，发完就不管，不需要响应
{ "jsonrpc": "2.0", "method": "task.progressChanged", "params": { "percent": 60 } }
```

### 最关键的特性：传输无关（Transport Agnostic）

JSON-RPC 只定义消息格式，**不关心怎么传输**。它可以跑在：

| 传输通道 | 实际应用 |
|---------|---------|
| HTTP POST | 以太坊节点 API（eth_getBalance 等） |
| WebSocket | 实时双向 RPC |
| **stdio** | **LSP**（编辑器 ↔ 语言服务器）、**MCP**（Claude ↔ 本地工具） |
| TCP/Unix Socket | 本地服务间通信 |
| **Electron IPC** | 主进程 ↔ 渲染进程封装成 JSON-RPC 风格 |

---

## 二、JSON-RPC 和 HTTP 的区别

⚠️ 先澄清：**这两个不是同一层的东西，严格来说不能直接对比**。

- **HTTP 是传输协议**（怎么把数据从 A 传到 B：报文、连接、状态码……）
- **JSON-RPC 是消息格式/RPC 协议**（数据里装的是什么语义：调用谁、结果如何）

两者是**可以叠加**的关系：JSON-RPC 完全可以在 HTTP 上传输（HTTP POST 一个 JSON-RPC 消息体）。

真正有意义的对比是：**JSON-RPC 风格 vs RESTful 风格**（两个都是基于 HTTP 设计 API 的方式）：

| | RESTful | JSON-RPC |
|---|---------|----------|
| 思维模型 | **资源**导向（名词） | **动作**导向（动词） |
| 端点 | 多个：`GET /users/123` | 单一：`POST /rpc` |
| 操作语义 | 用 HTTP 动词（GET/POST/PUT/DELETE） | 用 method 字段（`"user.delete"`） |
| 错误表达 | HTTP 状态码（404/500） | 统一 200，错误在 body 的 `error` 字段 |
| 批量调用 | 不支持 | 原生支持（发一个数组） |
| 通知（无响应） | 不支持 | 原生支持（Notification） |
| 适合场景 | CRUD、公开 API、需要 HTTP 缓存 | 内部服务间调用、双向通信、非 HTTP 传输 |

---

## 三、SSE（Server-Sent Events）是什么

**SSE 是一种基于 HTTP 的服务器单向推送技术**：客户端发起一个普通 HTTP 请求，服务器**不关闭连接**，持续往响应流里写数据，实现"服务器主动推消息"。

### 工作原理

```http
// 客户端：普通 GET 请求
GET /events HTTP/1.1
Accept: text/event-stream

// 服务器：响应头声明流式格式，连接保持不断开
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

// 之后服务器持续写入这种格式的数据块：
data: {"msg": "hello"}\n
\n
data: {"msg": "progress 60%"}\n
id: 100\n
event: progress\n
\n
```

客户端用浏览器原生 `EventSource` 接收：

```js
const source = new EventSource('/events');

source.onmessage = (e) => console.log(JSON.parse(e.data));

// 自定义事件类型（对应 event: 字段）
source.addEventListener('progress', (e) => console.log(e.data));

// 自带特性：断线自动重连、Last-Event-ID 断点续传
```

---

## 四、SSE vs WebSocket（高频对比题）

| | SSE | WebSocket |
|---|-----|-----------|
| 方向 | **单向**（服务器 → 客户端） | 双向 |
| 协议 | 就是 HTTP，过防火墙/代理无障碍 | 独立协议（ws://，HTTP 升级握手） |
| 数据格式 | 纯文本（UTF-8） | 文本 + 二进制 |
| 自动重连 | **浏览器原生内置** | 要自己实现（心跳 + 退避重连） |
| 断点续传 | 原生支持（Last-Event-ID） | 自己设计（seq/offset） |
| 实现成本 | 服务端就是持续写 HTTP 响应，极简 | 需要 ws 库、帧协议处理 |

**选型结论**：只有"服务器推、客户端收"的场景（消息推送、进度通知、日志流、AI 流式输出）→ SSE 更简单；需要双向实时交互 → WebSocket。

### 典型应用

- **ChatGPT / Claude 的流式打字输出** —— 就是 SSE，token 一个个 `data:` 推过来
- **MCP 的远程传输**：早期版本用「HTTP POST（客户端→服务端发 JSON-RPC）+ SSE（服务端→客户端推响应和通知）」组合，后来演进为 Streamable HTTP
- 构建进度推送、日志实时流、消息通知中心

---

## 五、三者关系一张图

```
MCP / LSP 这类现代协议的组合拳：

┌──────────┐   HTTP POST 或 stdio（传输层）   ┌──────────┐
│          │ ───────────────────────────────▶ │          │
│  Client  │   消息内容：JSON-RPC 2.0          │  Server  │
│          │ ◀─────────────────────────────── │          │
└──────────┘   SSE / stdio（服务端推送通道）    └──────────┘

- JSON-RPC：定义"说什么"（方法调用 + 响应 + 通知的格式）
- HTTP / stdio / WebSocket：定义"怎么运过去"
- SSE：补 HTTP 的短板，给单向的 HTTP 加上"服务器主动推"的能力
```

**一句话总结**：JSON-RPC 是消息格式（说什么），HTTP 是传输协议（怎么运），SSE 是 HTTP 上的单向推送增强（让服务器能主动说话）——三者是不同层级的概念，经常组合使用而不是互相替代。

---

## 六、JSON-RPC 用在哪里

共性规律：**凡是"程序调程序"的地方基本都有它**。两个最典型的领域：

### 1. LSP（Language Server Protocol）—— 教科书级应用

VS Code 能支持几百种语言的补全/跳转/报错，靠的就是 LSP，而 LSP 的消息层就是 JSON-RPC 2.0：

```
VS Code ──stdio──▶ typescript-language-server / rust-analyzer / gopls

{"jsonrpc":"2.0","id":1,"method":"textDocument/completion","params":{...}}
```

**为什么用 JSON-RPC**：编辑器（JS）和语言服务器（Rust/Go/Java）跨语言、跨进程，需要**双向调用**——服务器也能反向要求客户端弹窗、读配置。REST 做不到双向，WebSocket 对本地进程又太重，stdio + JSON-RPC 刚刚好。

（同门兄弟：DAP 调试适配器协议，同样是 JSON-RPC。）

### 2. AI / LLM 领域 —— 当下最火的应用

**MCP（Model Context Protocol）**：Cursor、Claude Desktop 调用本地工具（文件系统、数据库、Figma）就是 MCP，协议层就是 JSON-RPC 2.0：

```
Cursor/Claude ──stdio/SSE──▶ MCP Server

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"read_file",...}}
```

**为什么用 JSON-RPC**：
- 同一套协议要跑两种传输：本地走 **stdio**，远程走 **HTTP+SSE**——只有传输无关的协议能做到
- 需要**双向**：服务端也能向客户端发通知（工具列表变更）、反向请求（采样）

### 其他场景速览

| 场景 | 例子 |
|------|------|
| 区块链节点 | 以太坊 `eth_getBalance`、比特币节点，JSON-RPC over HTTP |
| 本地进程间通信 | agent 主进程 ↔ CLI 工具进程（stdio + JSON-RPC，跨语言零依赖） |
| Electron IPC 治理 | 把裸 IPC 收敛成 JSON-RPC 风格：通道收敛为 1 个、错误码标准化 |
| 微服务内部调用 | 比 gRPC 轻量（无需 protobuf），比 REST 更适合动作语义 |

**选择信号**：需要双向调用、传输层不固定、操作是动词而非资源、需要批量调用/通知 → 选 JSON-RPC；面向公众的 CRUD API、需要 HTTP 缓存 → 选 REST。

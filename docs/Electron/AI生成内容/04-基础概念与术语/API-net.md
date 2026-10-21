# net

`net` 是主进程里走 Chromium 网络栈的请求 API。它遵循系统代理和 PAC，也可以使用某一份 `session` 的 Cookie。Node.js 自带的 `http` 和 `fetch` 不读取系统代理。

文档：[https://www.electronjs.org/docs/latest/api/net](https://www.electronjs.org/docs/latest/api/net)

## 请求

```js
const { net } = require('electron');

const request = net.request({
  method: 'GET',
  url: 'https://example.com/api',
});
request.on('response', (response) => {
  const chunks = [];
  response.on('data', (chunk) => chunks.push(chunk));
  response.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
  });
});
request.end();
```

新代码也可以使用 `net.fetch(url)`，返回 Promise，接口接近浏览器的 `fetch`，同样走 Chromium 网络栈。`protocol.handle` 里把文件交给 `net.fetch(pathToFileURL(file).toString())` 是官方示例的写法。

`net` 在 `ready` 之后使用。`net.isOnline()` 反映 Chromium 认为的网络状态，网卡显示已连接但路由不通时，它仍可能为 `true`。关键连接用自己的心跳确认。

## 什么时候用 Node 的网络库

访问 `127.0.0.1` 上自己的服务时，用 Node 的 `http`，并在系统代理里绕过本地地址。大文件流如果已经在用 Node 的流式库，也可以留在 Node，同时自己处理代理。

## 相关文档

- [API-session](./API-session.md)
- [API-protocol](./API-protocol.md)

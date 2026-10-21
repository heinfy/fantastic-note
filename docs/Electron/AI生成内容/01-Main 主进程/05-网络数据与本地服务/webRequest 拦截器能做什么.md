# webRequest 拦截器能做什么？有哪些实际应用场景？

## 考察点

- webRequest 各阶段的拦截能力
- 实际工程场景与性能注意点

## 参考答案

### 1. 请求生命周期各拦截点

`session.webRequest` 按请求生命周期提供一系列钩子：

```js
const ses = session.defaultSession;

// 1. 请求发出前：可以阻断或重定向
ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
  if (details.url.includes('tracker.example.com')) {
    return callback({ cancel: true }); // 阻断请求
  }
  if (details.url.includes('old-api.com')) {
    return callback({ redirectURL: details.url.replace('old-api.com', 'new-api.com') });
  }
  callback({}); // 放行
});

// 2. 请求头发送前：可以修改请求头
ses.webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['User-Agent'] = 'MyAgent/1.0';
  details.requestHeaders['Authorization'] = `Bearer ${token}`;
  callback({ requestHeaders: details.requestHeaders });
});

// 3. 收到响应头后：可以修改响应头
ses.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["default-src 'self'"], // 注入 CSP
    },
  });
});

// 其他：onSendHeaders / onResponseStarted / onCompleted / onErrorOccurred
```

### 2. 典型应用场景

| 场景 | 用哪个钩子 |
|------|-----------|
| 统一注入鉴权 token / 自定义 UA | onBeforeSendHeaders |
| 广告/埋点请求拦截 | onBeforeRequest（cancel） |
| 域名切换/接口重定向（灰度） | onBeforeRequest（redirectURL） |
| 给本地页面注入 CSP 响应头 | onHeadersReceived |
| 删除响应头的 X-Frame-Options（内嵌第三方页） | onHeadersReceived |
| 请求监控/耗时统计 | onCompleted + onErrorOccurred |
| 绕过 CORS（改 Access-Control-Allow-Origin） | onHeadersReceived |

### 3. 实战示例：本地页面加载跨域接口

渲染进程 fetch 跨域接口被 CORS 拦截，可在响应头注入放行：

```js
ses.webRequest.onHeadersReceived(
  { urls: ['https://api.example.com/*'] },
  (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
      },
    });
  }
);
```

注意这只是绕过了**渲染进程的 CORS 检查**；更干净的方案是请求走主进程 `net` 模块（天然无 CORS）。

### 4. 性能与工程注意点（重要加分项）

1. **拦截器回调必须快**：所有匹配请求都被阻塞等待 callback，回调里做重活会拖垮全部网络请求。禁止在回调里做同步 IO/复杂计算。

2. **urls 过滤要尽量精确**：`{ urls: ['https://api.example.com/*'] }` 而不是 `['*://*/*']`，减少进入回调的请求数。

3. **同一钩子只能注册一个**：重复调用会覆盖之前的监听器（不是叠加）。多个业务都想拦截时要自己实现分发器：

```js
const handlers = [];
ses.webRequest.onBeforeRequest((details, callback) => {
  // 分发器：依次询问各业务拦截器
  for (const h of handlers) {
    const result = h(details);
    if (result) return callback(result); // 有业务要处理就短路
  }
  callback({});
});
```

4. **session 粒度**：拦截器挂在具体 session 上，多 partition 应用要注意覆盖面。

## 面试话术

> webRequest 覆盖请求全生命周期，常用三段：onBeforeRequest 做阻断/重定向、onBeforeSendHeaders 改请求头注入鉴权、onHeadersReceived 改响应头注入 CSP。工程上两个红线：回调必须轻量、urls 过滤必须精确；另外同钩子单监听，多业务要自己做分发。

## 常见追问

- **能修改请求体/响应体吗？** 不能（只能改头）。要改 body 需要协议层方案（自定义 protocol.handle 或本地代理）。
- **和 devtools 的网络面板是什么关系？** webRequest 在 Chromium 网络栈层拦截，devtools 面板能看到拦截后的结果。

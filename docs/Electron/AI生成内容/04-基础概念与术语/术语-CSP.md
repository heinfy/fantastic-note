# CSP

内容安全策略（Content Security Policy）是一条告诉 Chromium 可以加载哪些脚本、图片和网络地址的规则。官方安全清单要求给页面定义严格策略，例如脚本只允许来自自身。

本地页面可以在 HTML 里写：

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
>
```

也可以在 `session.webRequest.onHeadersReceived` 里给响应加上 `Content-Security-Policy` 头。

`script-src 'self'` 会拒绝内联脚本和 `eval`。开发服务器的热更新常常需要 `unsafe-eval` 和到本机的 WebSocket，这些放在开发环境的策略里。发布用的页面保持 `script-src 'self'`。

自定义协议下的图片要在 `img-src` 里写上该 scheme，例如 `img-src 'self' myapp: data:`。策略未列出的地址会被控制台记为 CSP 违规，资源不会加载。

`frame-ancestors` 不能放在 `<meta>` 里，需要响应头。

## 相关文档

- [概念-安全模型](./概念-安全模型.md)
- [API-session](./API-session.md)

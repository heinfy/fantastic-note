# CSP 怎么配置？开发环境 HMR 与生产 CSP 冲突怎么解决？

## 考察点

- CSP 在 Electron 场景的配置实践
- dev/prod 环境差异处理

## 参考答案

### 1. 为什么 Electron 必须配 CSP

CSP（Content Security Policy）是 XSS 的最后防线：即使恶意脚本注入成功，CSP 也能阻止它执行。Electron 官方安全清单明确要求配置 CSP，未配置时 DevTools 会警告。

### 2. 配置方式

**（1）HTML meta 标签（本地页面常用）**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: myapp: media:;
    connect-src 'self' https://api.example.com ws://127.0.0.1:*;
    font-src 'self';
    object-src 'none';
    base-uri 'none';
  "
/>
```

**（2）响应头注入（远程页面/统一管控）**

```js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["default-src 'self'; script-src 'self'"],
    },
  });
});
```

### 3. 各指令的 Electron 实践

| 指令 | 推荐值 | 说明 |
|------|--------|------|
| `default-src` | `'self'` | 默认只允许同源 |
| `script-src` | `'self'` | **不要** unsafe-inline/unsafe-eval（生产） |
| `style-src` | `'self' 'unsafe-inline'` | CSS-in-JS/内联 style 需要 unsafe-inline（样式注入风险较低，通常放行） |
| `img-src` | `'self' data: myapp: media:` | 自定义 scheme 和 data URL 要显式放行 |
| `connect-src` | `'self' + API 域名 + ws` | fetch/WebSocket 目标白名单 |
| `object-src` | `'none'` | 禁插件 |
| `base-uri` | `'none'` | 防 base 标签劫持相对路径 |
| `frame-src` | 按需 | 内嵌 iframe 的源白名单 |

### 4. dev 与 prod 的冲突与解法

**冲突点：**
- Vite/webpack HMR 需要 `ws://localhost:*` 的 connect-src
- React 刷新/某些构建工具需要 `'unsafe-eval'`
- dev server 的 script-src 要放行 `http://localhost:5173`

**解法：按环境生成不同 CSP**

```js
// 构建时注入环境变量，模板里条件输出
const isDev = process.env.NODE_ENV === 'development';

const csp = isDev
  ? [
      // 开发环境：放行 HMR 所需
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' http://localhost:*", // HMR 需要 eval
      "connect-src 'self' ws://localhost:* http://localhost:*", // HMR websocket
      "style-src 'self' 'unsafe-inline'",
    ].join('; ')
  : [
      // 生产环境：严格
      "default-src 'self'",
      "script-src 'self'",
      "connect-src 'self' https://api.example.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: myapp: media:",
    ].join('; ');
```

实践上把这个逻辑放在 HTML 模板（vite-plugin-html 之类按环境渲染）或主进程响应头注入层。

### 5. 常见坑

1. **自定义 scheme 没加白名单**：`img-src` 里漏了 `myapp:`，图片全挂，Console 报 CSP violation
2. **meta 标签里不能用的指令**：`frame-ancestors`、`report-uri`（部分）在 meta 中无效，要响应头
3. **第三方 SDK 被拦**：埋点/客服 SDK 的域名要逐一加白（script-src/connect-src/img-src 可能都要）
4. **CSP 误报排查**：DevTools Console 的 violation 报告明确指示哪个指令拦了哪个资源，按图索骥即可
5. **report-only 模式**：新策略上线先 `Content-Security-Policy-Report-Only` 观察一段时间，确认无误伤再强制

### 6. 面试话术

> CSP 是 Electron 安全的最后防线：生产基线 default-src 'self'、script-src 禁 inline/eval、img-src 放行自定义 scheme、object-src/base-uri 关掉。dev 与 prod 冲突的解法是按环境生成策略：dev 放行 HMR 的 ws 和 unsafe-eval，prod 严格收紧。新策略用 Report-Only 模式灰度，第三方 SDK 域名逐一审计加白。

## 常见追问

- **CSP 能防住所有 XSS 吗？** 不能——它能拦外部脚本加载和内联执行，但如果恶意代码通过白名单域内的渠道进入（如 CDN 被投毒）仍有风险。纵深防御的一部分。
- **nonce/hash 方案在 Electron 里值得做吗？** 本地页面没必要（内容可信），远程内容按 Web 标准实践即可。

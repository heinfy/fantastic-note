# webContents.executeJavaScript 有什么风险？什么时候可以用？

## 考察点

- 主进程能在页面里执行任意脚本
- 字符串拼接用户输入就是 XSS

## 参考答案

### 1. 能力

```js
await win.webContents.executeJavaScript('document.title');
```

这段字符串在**页面的主世界**里执行，能读 DOM、能调用 `window.api`。它不是隔离世界。

如果字符串里拼了用户名、文件名或服务端返回的内容：

```js
// 危险：name 里可以包含引号和脚本
await win.webContents.executeJavaScript(
  `window.renderReport("${name}")`
);
```

`name` 为 `"); require('child_process')...` 这类内容时，后果取决于页面当时有什么权限。即使 nodeIntegration 关着，它仍能调用你暴露的桥。

### 2. 可用的场景

- 自动化测试（Playwright 自己会用）
- 打印窗口里注入**已经在主进程序列化好的 JSON**，并且用参数而不是拼接

相对安全的传法是让页面提供函数，主进程只把 JSON.parse 过的数据当参数：

```js
const payload = JSON.stringify(report).replaceAll('<', '\\u003c');
await win.webContents.executeJavaScript(
  `window.renderReport(${payload})`
);
```

`JSON.stringify` 避免了引号打断语法。再把 `<` 转掉，避免数据被当成 HTML。页面上的 `renderReport` 必须把参数当文本用，不能 `innerHTML`。

更好的做法是不用执行脚本：页面加载完成后 `invoke` 来取数据，或主进程 `send` 一份纯数据。

### 3. 不要用来“修”页面

远程页面上注入脚本改 DOM、抓密码、自动点按钮，既脆弱也会把不可信页面和你的代码缠在一起。要改自己的页面就改源码。要隔离远程页面就用单独的 WebContentsView，不注入业务脚本。

`executeJavaScriptInIsolatedWorld` 跑在隔离世界，页面脚本看不到这段代码的变量，适合读 DOM。它仍然不应该拼接不可信字符串。

## 面试话术

> executeJavaScript 在页面主世界跑字符串，能碰到 window.api。用户输入和接口数据不能拼进这段字符串。页面要数据就用 send 或 invoke。真要注入，只注入 JSON.stringify 之后的参数，并让页面函数按文本渲染。远程页面不注入脚本。

## 常见追问

- **和 preload 比呢？** preload 在每次加载时固定执行，代码在你的包里。executeJavaScript 是运行中临时塞一段，更难审计，所以不能当功能扩展机制。
- **执行失败会怎样？** 返回的 Promise reject。调用方要 catch，不要让一次打印失败变成未处理拒绝。

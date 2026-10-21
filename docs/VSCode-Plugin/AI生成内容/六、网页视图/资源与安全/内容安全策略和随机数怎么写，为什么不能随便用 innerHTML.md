# 内容安全策略和随机数怎么写，为什么不能随便用 innerHTML？

## 结论

网页视图要写严格的内容安全策略。脚本只用带一次性随机数的内联脚本或本地资源，不要开 `unsafe-eval`。不可信内容不能拼进 `innerHTML`，否则工作区里的文件就能在插件页面里执行脚本。

## 展开

策略头写在 HTML 里：

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';"
/>
<script nonce="${nonce}" src="${scriptUri}"></script>
```

含义：

- `default-src 'none'`：除了显式放开的类型，全部拒绝。
- `script-src 'nonce-...'`：只有带这个随机数的脚本能跑。随机数每次渲染 HTML 重新生成，用密码学随机，不要用时间戳。
- `style-src` 里的 `'unsafe-inline'` 常常是为了兼容编辑器注入的样式。脚本不要照抄成 `unsafe-inline`。
- `webview.cspSource` 是这个网页能加载的本地资源来源。

`enableScripts` 不打开时，所有脚本都不执行。打开了也不等于可以不写策略。

工作区文件、接口返回、用户输入都是不可信的。要显示文本就用 `textContent`，或先做 HTML 转义再插入。`innerHTML` 会把字符串里的标签当成结构。攻击者只要在仓库里放一个带 `<script>` 的文件名或 Markdown，就可能在你的预览里执行。

需要富文本时，用白名单消毒，而不是替换几个尖括号。

## 容易讲错的点

- 随机数只写在策略里、脚本标签上忘了写，脚本不会执行。两边要同一份值。
- 每次更新 `webview.html` 都会整页重载。不要靠不停重设 HTML 来更新数据，数据走 `postMessage`。
- 从 CDN 拉脚本就要在策略里放行那个域名，同时也就信任了那个域名。插件里能本地打包就本地打包。

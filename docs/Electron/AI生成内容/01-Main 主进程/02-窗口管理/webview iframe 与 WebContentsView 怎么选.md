# webview、iframe、WebContentsView 嵌入远程页面时怎么选？

## 考察点

- 三种嵌入方式的隔离级别
- webview 的历史包袱

## 参考答案

### 1. 对比

| | iframe | `<webview>` | WebContentsView |
|---|---|---|---|
| 谁创建 | 页面 HTML | 页面标签，要开 `webviewTag` | 主进程 |
| 进程 | 可能和父页面拆进程（站点隔离） | 独立 guest 进程 | 独立 webContents |
| 父页面能否碰到它 | 同源能，跨域受浏览器限制 | 页面可通过标签属性影响它 | 页面碰不到，只能经 IPC 让主进程操作 |
| preload | 继承父页面的文档环境 | 可以单独指定，但默认权限容易配错 | `webPreferences` 由主进程写死 |
| 推荐度 | 可信、同源的小块内容 | 不推荐新项目使用 | 不可信或要独立生命周期的内容 |

### 2. 为什么少用 webview

`<webview>` 由**页面**声明。页面一旦能插入这个标签，就有机会带上恶意 `preload` 或打开 Node。官方要求用 `will-attach-webview` 把权限剥掉：

```js
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.contextIsolation = true;
    if (!params.src.startsWith('https://docs.example.com/')) {
      event.preventDefault();
    }
  });
});
```

能写这段拦截，通常还不如主进程直接 `new WebContentsView()`，从源头不让页面决定加载什么。

### 3. 选型

- 帮助文档、同一产品里的一块说明：同源 iframe 就够
- OAuth、第三方后台、广告或不可信 HTML：主进程创建 `WebContentsView`，独立 session，不挂业务 preload
- 老项目已经大量用 webview：保留时必须有 `will-attach-webview`，新功能不再加

`webviewTag` 默认是 `false`。没有现成 webview 就不要为了“方便”把它打开。

## 面试话术

> 可信小块用 iframe。不可信或要独立进程、独立 session 的页面用主进程创建的 WebContentsView。webview 由页面创建，权限边界在页面手里，新代码不用；旧代码必须在 will-attach-webview 里删掉 preload 并校验 src。

## 常见追问

- **iframe 里的页面能调 window.api 吗？** 父页面暴露在主世界的对象，同源 iframe 可以碰到。所以业务桥不要挂到会被第三方 iframe 读到的页面上。
- **guest 里要不要开 sandbox？** 要。远程内容用最严的 webPreferences，和主窗口分开。

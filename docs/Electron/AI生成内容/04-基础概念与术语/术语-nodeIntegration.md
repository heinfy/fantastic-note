# nodeIntegration

`nodeIntegration` 控制渲染进程的页面能不能直接使用 Node.js，例如在页面脚本里 `require('fs')`。默认是 `false`。

打开之后，页面里的任何脚本，包括 XSS 注入的脚本，都能读文件、起子进程。官方安全清单要求：加载远程内容时不要开启 Node 集成。

还有两个相关开关，默认也应保持关闭：

- `nodeIntegrationInWorker`：Web Worker 里能否使用 Node。
- `nodeIntegrationInSubFrames`：子框架里能否使用 Node。

只关掉顶层页面的 Node、却打开 Worker 的 Node，页面仍可以新建 Worker 来调用 Node。

页面需要文件或对话框时，把操作放在主进程，用预加载脚本暴露一个具体函数。`nodeIntegration: true` 还会自动禁用该渲染进程的沙箱。

## 相关文档

- [术语-webPreferences](./术语-webPreferences.md)
- [概念-安全模型](./概念-安全模型.md)

# Webview（网页视图）

扩展拥有的一块 HTML 界面，跑在独立的 iframe 式上下文里，不能访问扩展宿主里的对象，也不能改 VS Code 主 DOM。

三种用法：`createWebviewPanel` 放在编辑器标签，`WebviewViewProvider` 放在侧栏，自定义编辑器用它打开某种文件并参与保存。

本地资源要 `asWebviewUri`，并限制 `localResourceRoots`。和扩展通信用 `postMessage`。`html` 必须是完整文档。

参考：https://code.visualstudio.com/api/extension-guides/webview

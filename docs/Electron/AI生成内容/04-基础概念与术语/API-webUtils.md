# webUtils

`webUtils` 在预加载脚本或渲染进程里，把网页的 `File` 对象换成文件系统路径。Electron 32 移除了 `File.path`，拖拽和 `<input type="file">` 要改用这个模块。

文档：[https://www.electronjs.org/docs/latest/api/web-utils](https://www.electronjs.org/docs/latest/api/web-utils)

## getPathForFile

```js
const { webUtils, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  pathForFile: (file) => webUtils.getPathForFile(file),
});
```

页面把拖进来的 `File` 传给 `pathForFile`，得到本地路径。文件内容仍可以用 `file.text()` 或 `file.arrayBuffer()` 读取，那不需要路径。

路径一旦到了页面里，就可能被改掉再传回主进程。主进程打开文件前，确认路径位于允许的目录，或者根本只接受本次对话框返回的路径。

`webUtils` 不提供任意路径的读取能力，它只解析浏览器已经拿到的那个 `File`。

## 相关文档

- [概念-预加载脚本](./概念-预加载脚本.md)
- [API-dialog](./API-dialog.md)

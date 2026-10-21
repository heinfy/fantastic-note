# shell

`shell` 用操作系统的默认方式打开链接、文件和文件夹。主进程和预加载脚本（沙箱允许时）都可以调用。页面要打开外部链接时，经 IPC 把 URL 交给主进程。

文档：[https://www.electronjs.org/docs/latest/api/shell](https://www.electronjs.org/docs/latest/api/shell)

## 方法

| 方法 | 作用 |
|------|------|
| `shell.openExternal(url)` | 用系统默认程序打开 URL，例如浏览器打开 https |
| `shell.openPath(path)` | 用默认程序打开本地文件或目录。返回一个 Promise，失败时得到错误字符串 |
| `shell.showItemInFolder(path)` | 在文件管理器中定位该文件 |
| `shell.trashItem(path)` | 把文件移到废纸篓 |
| `shell.beep()` | 播放系统提示音 |

```js
const { shell } = require('electron');

async function openHttps(raw) {
  const url = new URL(raw);
  if (url.protocol !== 'https:') return;
  await shell.openExternal(url.toString());
}
```

`openExternal` 会把字符串交给系统。只把预期的协议传进去，例如 `https:` 和 `mailto:`。`file:`、`javascript:` 和其他自定义协议要单独决定。

`openPath` 的路径来自主进程刚刚创建或用户刚刚选择的文件。用 `path.basename` 处理下载文件名，避免响应头里的 `../`。

## 相关文档

- [API-dialog](./API-dialog.md)
- [概念-安全模型](./概念-安全模型.md)

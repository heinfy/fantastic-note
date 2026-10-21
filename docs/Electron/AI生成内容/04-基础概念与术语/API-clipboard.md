# clipboard

`clipboard` 读写系统剪贴板，支持文本、HTML、图片、RTF 和书签。主进程可以直接使用。

文档：[https://www.electronjs.org/docs/latest/api/clipboard](https://www.electronjs.org/docs/latest/api/clipboard)

## 常用方法

```js
const { clipboard, nativeImage } = require('electron');

clipboard.writeText('纯文本');
const text = clipboard.readText();

const image = clipboard.readImage();
if (!image.isEmpty()) {
  const dataUrl = image.toDataURL();
}
```

| 方法 | 内容 |
|------|------|
| `writeText` / `readText` | 纯文本 |
| `writeHTML` / `readHTML` | HTML |
| `writeImage` / `readImage` | `nativeImage` |
| `writeRTF` / `readRTF` | 富文本 |
| `clear` | 清空 |
| `availableFormats` | 当前剪贴板里有哪些格式 |

页面有焦点时，也可以用浏览器的 `navigator.clipboard`。应用在后台要读写，或要处理 HTML、RTF 时，用 Electron 这份模块，经 IPC 包一层。

剪贴板内容来自任意应用，按不可信文本处理，不要直接 `innerHTML`。

## 相关文档

- [API-nativeImage](./API-nativeImage.md)

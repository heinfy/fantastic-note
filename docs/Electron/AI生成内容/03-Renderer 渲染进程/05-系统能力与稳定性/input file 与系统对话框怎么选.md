# input type=file 和 dialog.showOpenDialog 怎么选？

## 考察点

- 页面文件选择拿到的是 File，不是路径
- 什么时候必须走主进程对话框

## 参考答案

### 1. 页面里的 input

```html
<input type="file" multiple />
```

`change` 里得到的是 `File`。可以用 `file.arrayBuffer()` / `file.text()` 读内容，适合小文件预览、拖进来立刻显示。

它**不提供稳定的文件系统路径**。Electron 32 之后 `File.path` 已移除。要用路径得在 preload 里 `webUtils.getPathForFile(file)`。路径一到页面手里，就有机会被改完再传回主进程，主进程仍要检查这个路径是否允许读。

`input` 的另一个限制是：不好指定默认目录、不好强制文件类型到操作系统对话框那一层（`accept` 只是提示）。

### 2. 主进程对话框

保存、导入到应用目录、要记住用户上次打开的文件夹时，用 `dialog.showOpenDialog`：

```js
ipcMain.handle('file:pick', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: '图片', extensions: ['png', 'jpg'] }],
  });
  if (result.canceled) return null;
  // 路径留在主进程，页面只拿一个本次选择的 id
  return rememberPickedFile(result.filePaths[0]);
});
```

对话框要传入 `win`，macOS 上才会作为这个窗口的 sheet，而不是跑到别的桌面。

### 3. 怎么选

| 需求 | 选择 |
|------|------|
| 选一张图立刻本地预览 | `input` 或拖拽，读 File 内容 |
| 把文件拷进 userData、之后用路径监控 | 主进程对话框，路径不回页面 |
| 用户指定保存位置 | `showSaveDialog` |
| 选择目录 | `showOpenDialog` 加 `openDirectory`，不要用 input 的 webkitdirectory 凑合 |

拖拽和 `input` 一样，内容用 File API，路径用 `webUtils`，并且主进程不信任页面传来的任意字符串路径。

## 面试话术

> 预览用 input 或拖拽拿到的 File 读内容。要落盘、监控、记住目录，用主进程的 showOpenDialog，并把路径留在主进程，页面只拿 id。File.path 已经不能用了。对话框绑父窗口。主进程不接受页面随意拼的路径。

## 常见追问

- **为什么不把 webUtils 的路径直接当可信路径？** 页面可以改完再传回来。可信的是主进程对话框刚刚返回的那一次路径，最好根本不要回传。
- **多选文件很大怎么读？** 不要在渲染进程把每个文件 arrayBuffer 进内存。把选择交给主进程，用流复制。

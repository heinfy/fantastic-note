# dialog

`dialog` 在主进程弹出系统文件框、消息框和保存框。渲染进程通过 IPC 调用它，并把当前窗口作为父窗口传进去。macOS 上父窗口会让对话框以 sheet 形式出现。

文档：[https://www.electronjs.org/docs/latest/api/dialog](https://www.electronjs.org/docs/latest/api/dialog)

## 打开文件

```js
const { dialog, BrowserWindow, ipcMain } = require('electron');

ipcMain.handle('dialog:open', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '图片', extensions: ['png', 'jpg'] }],
  });
  if (result.canceled) return [];
  return result.filePaths;
});
```

`properties` 还可以是 `openDirectory`、`createDirectory`、`dontAddToRecent`。

## 其他对话框

| 方法 | 作用 |
|------|------|
| `showSaveDialog` | 选择保存路径，返回 `filePath` |
| `showMessageBox` | 询问或提示，返回用户点的按钮下标 |
| `showErrorBox` | 简单错误框，可以在 `ready` 之前使用 |
| `showCertificateTrustDialog` | macOS 上显示证书信任对话框 |

这些方法都有同步版本（名字以 `Sync` 结尾）。同步版本会堵住主进程，界面多的应用使用异步版本。

消息框的 `buttons`、`defaultId` 和 `cancelId` 决定返回值。不要用对话框文本去判断用户选择了什么。

## 相关文档

- [API-shell](./API-shell.md)
- [概念-主进程与渲染进程](./概念-主进程与渲染进程.md)

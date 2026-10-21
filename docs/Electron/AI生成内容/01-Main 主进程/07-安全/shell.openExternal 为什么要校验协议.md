# shell.openExternal 为什么必须校验协议？

## 考察点

- 打开外部链接是主进程能力
- `file:`、`javascript:`、`smb:` 一类协议能造成什么

## 参考答案

### 1. 风险

`shell.openExternal(url)` 把字符串交给操作系统打开。页面如果能传入任意字符串，就不只是打开浏览器：

- `file:///...` 可能用系统默认程序打开本地文件
- `javascript:` 在部分处理链上会变成脚本
- `smb://`、`nfs://` 会触发网络挂载或凭据提示
- 自定义协议可能唤起别的本地应用

渲染进程里的链接、服务端下发的跳转地址，都按不可信处理。

### 2. 校验后再打开

```js
const ALLOWED = new Set(['https:', 'mailto:']);

ipcMain.handle('shell:open', (_event, raw) => {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (!ALLOWED.has(url.protocol)) return false;
  // 禁止把凭据嵌在 URL 里
  if (url.username || url.password) return false;
  return shell.openExternal(url.toString());
});
```

应用内页面跳转不要走 `openExternal`。那是 `loadURL` 或路由的事。只有明确“离开应用、交给系统”才用它。

### 3. 和 will-navigate 的配合

窗口里点 `<a target="_blank">` 会进 `setWindowOpenHandler`。外部链接在那里 `openExternal` 后 `deny`，同样要先过协议白名单，不能因为是点击就放行。

`shell.openPath` 打开本地文件时，路径必须来自主进程自己的下载目录或用户刚刚在对话框里选中的文件，不要来自页面拼出来的字符串。

## 面试话术

> openExternal 等于把字符串交给系统。我只允许 https 和 mailto，用 URL 解析而不是看前缀，并且丢掉带账号密码的地址。file、javascript、smb 一律拒绝。窗口里的新链接也走同一套判断，通过了才打开系统浏览器并拒绝在应用内开窗。

## 常见追问

- **http 为什么默认不放？** 可以按产品放行，但要单独说出来。内部系统全是 http 时，白名单写成那几个主机名，而不是所有 http。
- **用 startsWith('https://') 行不行？** 不行。`https://evil.com\@good.com` 一类解析差异，和大小写、空白，都应该交给 `new URL`。

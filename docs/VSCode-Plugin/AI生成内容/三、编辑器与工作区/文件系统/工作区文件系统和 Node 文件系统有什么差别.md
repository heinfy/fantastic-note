# 工作区文件系统和 Node 文件系统有什么差别？

## 结论

`workspace.fs` 走 VS Code 的文件系统提供器，能访问远程、虚拟文档和无本地路径的资源。Node 的 `fs` 只看得到扩展宿主这台机器上的真实路径。插件只要面对用户工作区里的文件，就应该用 `workspace.fs`。

## 展开

```ts
const bytes = await vscode.workspace.fs.readFile(uri);
const stat = await vscode.workspace.fs.stat(uri);
await vscode.workspace.fs.writeFile(uri, Buffer.from("文本"));
```

`workspace.fs` 的 URI 可以是：

- `file:` 本地文件
- 远程窗口里映射出来的工作区文件
- 插件自己注册的 scheme，例如虚拟的只读预览

Node `fs` 需要 `uri.fsPath`。遇到下面几种情况会错：

- 网页版没有 Node。
- 界面扩展宿主在本机，工作区在 SSH 远端，`fsPath` 指向的是另一台机器上的路径。
- `untitled:` 或自定义 scheme 没有本地路径。
- 文件在虚拟工作区里，根本没有对应磁盘文件。

异常类型也不同。`workspace.fs` 抛 `FileSystemError`，可以用 `FileSystemError.FileNotFound` 判断。不要用 Node 的 `error.code === "ENOENT"` 去接它。

监视文件用 `workspace.createFileSystemWatcher`，不要自己 `fs.watch`。前者理解工作区的提供器，也能正确过滤。

## 容易讲错的点

- `workspace.fs` 读的是磁盘或提供器，不是未保存的编辑缓冲区。编辑中的文本仍要读 `TextDocument`。
- `fsPath` 在 Windows 和远程下都不适合当跨平台主键，比较资源用 `uri.toString()` 或 `Uri` 自身。
- 工作区提供器的写操作可能有权限和大小限制，失败要展示 `FileSystemError` 的信息，不要吞掉。

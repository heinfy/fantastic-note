# FileSystemProvider（文件系统提供器）

给一种 `scheme` 提供读、写、监听的实现。注册后，`workspace.fs` 和资源管理器都会通过它访问 `myscheme://...`。

要处理 `stat`、`readDirectory`、`readFile`、`writeFile`，以及按能力声明是否可写、是否区分大小写。文件变化用 `onDidChangeFile` 报告，并带上前进了的 `mtime`，否则监视方可能不刷新。

它和虚拟文本文档不同：文件系统提供器是完整的文件树；`TextDocumentContentProvider` 只在编辑器索取文本时返回一段只读字符串。

参考：https://code.visualstudio.com/api/references/vscode-api

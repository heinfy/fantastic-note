# DocumentSelector（文档选择器）

注册语言功能时用来圈定「哪些文档该问我」。它可以是语言 ID 字符串、`DocumentFilter` 对象，或它们的数组。

`DocumentFilter` 可包含 `language`、`scheme`、`pattern`、`notebookType`。只写语言会匹配所有 scheme，包括 `git` 里的虚拟缓冲。只要磁盘文件就写上 `scheme: 'file'`。

`languages.match` 给出分数：不匹配为 0，`*` 为 5，精确或 glob 命中为 10。

参考：https://code.visualstudio.com/api/references/vscode-api

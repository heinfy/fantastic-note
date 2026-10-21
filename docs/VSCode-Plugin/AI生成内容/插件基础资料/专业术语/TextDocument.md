# TextDocument（文本文档）

编辑器内存里的一份文本缓冲。字段包括 `uri`、`fileName`、`languageId`、`version`、`lineCount`、`isDirty`、`isClosed`、`eol`。

`getText` 读的是缓冲，不是磁盘上的文件。文档可以尚未保存，也可以来自 `git`、`untitled` 或其他 scheme。它不包含光标和选区，那些在 `TextEditor` 上。

关闭标签不保证文档立刻销毁，也不保证一定收到关闭事件。

参考：https://code.visualstudio.com/api/references/vscode-api

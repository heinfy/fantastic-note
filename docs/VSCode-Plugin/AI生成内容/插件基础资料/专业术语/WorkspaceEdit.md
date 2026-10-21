# WorkspaceEdit（工作区编辑）

一组还没应用的修改，可以跨多个 `Uri`，也可以包含创建、删除、重命名文件。

文本修改用 `insert`、`delete`、`replace` 或 `TextEdit`。用 `workspace.applyEdit` 一次提交。它不需要当前有焦点编辑器。

`TextEditor.edit` 只改当前编辑器里的那一份文档，builder 离开回调就失效。改多个文件用 WorkspaceEdit。

参考：https://code.visualstudio.com/api/references/vscode-api

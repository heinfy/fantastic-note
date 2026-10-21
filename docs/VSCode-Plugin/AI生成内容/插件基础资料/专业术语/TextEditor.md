# TextEditor（文本编辑器）

把一份 `TextDocument` 显示出来的界面。同一个文档可以对应零个或一个当前可见编辑器。

上面有 `selection`、`selections`、`visibleRanges`、`viewColumn` 和缩进等 `options`。`edit(callback)` 用只在回调期间有效的 `TextEditorEdit` 修改这篇文档。

要改多个文件、或不依赖当前焦点，用 `WorkspaceEdit` 和 `workspace.applyEdit`。

参考：https://code.visualstudio.com/api/references/vscode-api

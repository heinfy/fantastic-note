# CompletionItem（补全项）

建议列表里的一项。至少有 `label`。接受后插入 `insertText`；它也可以是 `SnippetString`，从而带上跳转占位符。

`additionalTextEdits` 在插入的同时修改文档其他位置，例如补 import。`command` 在接受之后再执行一条命令。能用文本编辑表达的改动，优先放进 `additionalTextEdits`。

`kind`、`detail`、`documentation`、`sortText`、`filterText`、`preselect` 控制图标、说明和排序。`commitCharacters` 是接受补全的额外按键。

参考：https://code.visualstudio.com/api/references/vscode-api

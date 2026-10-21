# CodeAction（代码操作）

灯泡菜单里的一个动作，例如快速修复或重构。字段有 `title`、`kind`、`edit`、`command`、`diagnostics`、`isPreferred`。

`edit` 是 `WorkspaceEdit`，由编辑器应用。`command` 适合还要弹界面或做异步工作的情况。两者都有时，先应用编辑再执行命令。

`CodeActionKind` 里常见 `QuickFix`、`Refactor`、`Source`。提供器 metadata 用来声明自己提供哪些 kind，编辑器可以少问无关的提供器。

参考：https://code.visualstudio.com/api/references/vscode-api

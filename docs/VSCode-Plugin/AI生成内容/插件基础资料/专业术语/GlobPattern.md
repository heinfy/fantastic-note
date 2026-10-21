# GlobPattern

匹配文件路径的模式。`findFiles`、`createFileSystemWatcher`、`DocumentFilter.pattern`、`workspaceContains` 都用它。

`*` 匹配一层里的字符，`**` 跨目录，`?` 匹配一个字符，`{ts,js}` 匹配其中一种。相对模式相对于工作区文件夹。多根工作区里可以用 `RelativePattern` 把模式绑到某一个文件夹。

`workspaceContains:**/.editorconfig` 这类激活事件里的模式，是「打开的文件夹中是否存在匹配文件」。

参考：https://code.visualstudio.com/api/references/vscode-api

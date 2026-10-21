# Uri

统一资源标识，用来指向一份资源，而不只是本地磁盘路径。

`scheme` 说明谁来读它：`file` 是本地文件，`untitled` 是未保存缓冲，`vscode` 用来打开扩展，自定义 scheme 交给文件系统提供器或虚拟文档。

常用构造：`Uri.file`、`Uri.parse`、`Uri.joinPath`。远程和网页扩展里用 `Uri`，不要把 `fsPath` 当成界面所在机器上的路径。

参考：https://code.visualstudio.com/api/references/vscode-api

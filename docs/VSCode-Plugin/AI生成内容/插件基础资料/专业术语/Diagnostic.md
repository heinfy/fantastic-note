# Diagnostic（诊断）

问题面板和编辑器波浪线背后的一条记录：范围、消息、严重程度（Error、Warning、Information、Hint），以及可选的 `source` 和 `code`。

诊断放进 `DiagnosticCollection`，按 `Uri` 整份替换。集合由创建它的扩展清理。停用时不 `dispose`，旧波浪线会留下来。

语言服务器可以用推送（`publishDiagnostics`）或按文档拉取（`textDocument/diagnostic`）把诊断送到客户端，客户端再写入集合。

参考：https://code.visualstudio.com/api/references/vscode-api

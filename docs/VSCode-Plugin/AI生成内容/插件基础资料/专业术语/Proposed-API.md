# Proposed API（提议中的 API）

已经写进 `vscode.d.ts` 的提案区、但还没承诺稳定的 API。签名可能在小版本里改掉或删掉。

使用时要在 `package.json` 的 `enabledApiProposals` 里点名打开，并且一般不能直接发布到市场，除非该提案已经允许。稳定扩展应只依赖当前 `engines.vscode` 对应的正式 API。

聊天、语言模型一类能力里，稳定部分和提案部分是分开的。写之前看类型定义上有没有 proposal 注释。

参考：https://code.visualstudio.com/api/advanced-topics/using-proposed-api

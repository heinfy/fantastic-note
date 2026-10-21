# Thenable

带 `then` 方法的对象。`Promise` 是 Thenable。扩展 API 写成 `Thenable<T>`，是为了不把返回值绑死在某一种 Promise 实现上。

提供器可以同步返回结果，也可以返回 Thenable。`executeCommand`、`showQuickPick` 的结果都是 Thenable。用户取消选择时，很多 UI 方法会解析为 `undefined`，而不是拒绝。

参考：https://code.visualstudio.com/api/references/vscode-api

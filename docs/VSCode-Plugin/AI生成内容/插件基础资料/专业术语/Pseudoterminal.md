# Pseudoterminal（伪终端）

由扩展实现的终端，不是系统 shell。接口要求处理 `open`、`close`、`handleInput`，并用 `onDidWrite` 输出，用 `onDidClose` 结束。

创建方式是 `window.createTerminal({ name, pty })`。适合任务向导和彩色日志。要跑用户的 bash 或 zsh 时，用普通 `createTerminal`，不要自己模拟 shell。

任务里的 `CustomExecution` 也是把一个 `Pseudoterminal` 交给任务系统。

参考：https://code.visualstudio.com/api/references/vscode-api

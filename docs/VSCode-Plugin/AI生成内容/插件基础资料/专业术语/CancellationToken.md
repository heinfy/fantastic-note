# CancellationToken（取消令牌）

一次操作是否已被放弃的标志。`isCancellationRequested` 表示已经取消，`onCancellationRequested` 用来打断自己的定时器或网络请求。

补全、悬停、代码操作的提供器会收到 VS Code 创建的令牌。用户继续打字后，上一轮令牌作废，过期结果不应再写入界面。

自己创建令牌用 `CancellationTokenSource`，结束时 `dispose`。

参考：https://code.visualstudio.com/api/references/vscode-api

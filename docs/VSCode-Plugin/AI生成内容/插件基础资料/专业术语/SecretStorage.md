# SecretStorage

`ExtensionContext.secrets` 上的密钥存储。`get`、`store`、`delete`、`onDidChange` 都是异步的。系统密钥链负责落盘，扩展拿不到原始加密文件。

访问令牌、刷新令牌放这里。`globalState` 和日志、网页消息里都不要出现令牌明文。

参考：https://code.visualstudio.com/api/references/vscode-api

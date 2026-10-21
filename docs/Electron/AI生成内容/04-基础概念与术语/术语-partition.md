# partition

`partition` 是选择 `session` 的字符串，写在 `webPreferences` 里，也可以传给 `session.fromPartition`。

- `persist:名称`：持久分区。Cookie、localStorage、缓存写在 `userData/Partitions` 下面，应用重启还在。
- `名称`（没有 `persist:`）：内存分区。进程结束后数据消失。

相同字符串的窗口共享同一份 session。不同字符串互相隔离，因此可以用来同时登录多个账号。

协议处理器、代理、下载事件和权限回调都挂在 session 上。给 `partition: 'persist:a'` 的窗口注册协议时，要使用 `session.fromPartition('persist:a').protocol`，而不是只注册默认 session。

`webPreferences` 里如果同时写了 `session` 对象和 `partition`，以 `session` 为准。

## 相关文档

- [概念-会话与分区](./概念-会话与分区.md)
- [API-session](./API-session.md)

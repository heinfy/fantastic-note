# userData

`userData` 是 `app.getPath('userData')` 返回的目录，用来放配置、数据库、分区存储和日志。它按用户和应用程序名隔离：

- macOS：`~/Library/Application Support/<应用名>`
- Windows：`%APPDATA%\<应用名>`
- Linux：`~/.config/<应用名>`

安装目录里的文件会在更新时被替换，而且普通用户往往没有写权限。可写数据放在 `userData`。

更换目录使用 `app.setPath('userData', nextPath)`，并且放在 `ready` 事件之前。单实例锁的范围也是这一份 `userData`。测试版和正式版要同时运行时，给它们不同的 `userData`。

`app.getPath('logs')` 默认位于 `userData` 之下。卸载程序不一定删除这个目录；是否保留配置，由安装脚本或应用自己决定。

## 相关文档

- [API-app](./API-app.md)
- [术语-单实例锁](./术语-单实例锁.md)

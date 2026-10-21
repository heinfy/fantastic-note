# Memento

`ExtensionContext` 上的小块键值存储。`globalState` 跨所有工作区，`workspaceState` 只属于当前工作区。

`get` 读取，`update` 写入，值为 `undefined` 时删除。适合记住面板开关、上次选中的账号名这类扩展自己的状态。

它不是设置，用户在设置界面里看不到。用户可改的选项用 `contributes.configuration`。令牌不要放这里，改用 `SecretStorage`。

参考：https://code.visualstudio.com/api/references/vscode-api

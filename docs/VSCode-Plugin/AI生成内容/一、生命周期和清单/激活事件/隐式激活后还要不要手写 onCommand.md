# 隐式激活后还要不要手写 onCommand？

## 结论

从 VS Code 1.74 起，写在 `contributes.commands` 里的命令会自动生成 `onCommand:命令id`。只为了「点命令时激活」时，可以不手写。其他激活事件仍然要自己声明。

## 展开

以前漏写 `onCommand` 是高频故障：菜单上看得到命令，点下去没有回调，因为插件根本没激活，`registerCommand` 没执行。

现在清单里有：

```json
{
  "contributes": {
    "commands": [{ "command": "myext.hello", "title": "问好" }]
  }
}
```

宿主会在这条命令被执行时激活插件。`activationEvents` 里再写一遍 `onCommand:myext.hello` 不报错，只是重复。

仍然必须手写的情况：

- `onLanguage`、`onView`、`workspaceContains`、`onStartupFinished`、`onUri`、`onFileSystem` 都不会从 commands 推断出来。
- 命令没有出现在 `contributes.commands` 里，只在代码里 `registerCommand`。这种命令不会进命令面板，也没有隐式激活。
- 需要兼容远古版本时，可以继续显式写上 `onCommand`。`engines.vscode` 如果已经高于 1.74，可以省略。

面试时可以补一句：隐式激活解决的是「命令触发加载」，不解决「菜单是否显示」。菜单仍由 `contributes.menus` 和 `when` 决定。

## 容易讲错的点

- 不是所有贡献点都隐式激活。视图、语言、文件特征仍要写事件。
- 代码里注册了命令，不代表清单里可以不声明。不声明就不会出现在命令面板。
- `engines.vscode` 写得很低却依赖隐式激活，旧编辑器上命令会点了没反应。

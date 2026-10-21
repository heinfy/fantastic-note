# vscode.commands

命令命名空间。一个命令是带唯一 ID 的函数。用 `registerCommand` 注册后，可以被快捷键、菜单、命令面板或 `executeCommand` 调用。

要出现在命令面板里，还得在 `contributes.commands` 里写同一个 ID 和标题。

## 方法

| 方法 | 作用 |
| --- | --- |
| `registerCommand(command, callback, thisArg?)` | 注册命令，返回 `Disposable`。同一 ID 注册两次会报错 |
| `registerTextEditorCommand(command, callback, thisArg?)` | 仅当存在活动文本编辑器时执行。回调收到 `textEditor` 和只在回调期间有效的 `edit` |
| `executeCommand<T>(command, ...rest)` | 执行命令。返回 Thenable，处理函数没返回值时结果是 `undefined` |
| `getCommands(filterInternal?)` | 列出命令 ID。`filterInternal: true` 时去掉下划线开头的内部命令 |

`executeCommand` 调用编辑器内置命令时，参数只能是 `string`、`boolean`、`number`、`undefined`、`null`，以及 `Position`、`Range`、`Uri`、`Location`。调用扩展贡献的命令没有这个限制。

## 示例

```ts
context.subscriptions.push(
  vscode.commands.registerCommand('demo.hello', async () => {
    // 复用内置命令打开指定文档
    await vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.file('/tmp/demo.txt')
    );
  })
);
```

## 参考

- https://code.visualstudio.com/api/extension-guides/command
- https://code.visualstudio.com/api/references/vscode-api

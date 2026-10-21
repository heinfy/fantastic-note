# 上下文键与 when 子句

上下文键描述编辑器眼下的状态，例如有没有选中文本、当前语言是不是 TypeScript、侧栏列表有没有焦点。when 子句是用这些键写成的条件。菜单、快捷键、视图是否显示，都靠它。

扩展用 `setContext` 写入自己的键：

```ts
// 第二个参数会变成上下文键 demo.hasData 的值
await vscode.commands.executeCommand('setContext', 'demo.hasData', true);
```

官方文档把 `setContext` 当作命令来调用。键名建议带扩展前缀，避免和内置键或其他扩展撞车。

## 运算符

优先级从高到低是 `!`、`&&`、`||`。

| 种类 | 写法 | 例子 |
| --- | --- | --- |
| 非、与、或 | `!` `&&` `\|\|` | `editorTextFocus && !editorReadonly` |
| 相等 | `==` `!=` | `editorLangId == typescript` |
| 比较 | `>` `>=` `<` `<=` | `workspaceFolderCount < 2`，运算符两边要有空格 |
| 正则 | `=~` | `resourceFilename =~ /docker/` |
| 包含 | `in` / `not in` | `resourceFilename in demo.supportedFolders` |

`===` 和 `==` 行为相同。没有 `!=~`，用 `!(foo =~ /baz/)`。正则字面量还要再过一层 JSON 转义。支持的标志是 `i`、`s`、`m`、`u`；`g` 和 `y` 会被忽略。

带空格的字符串要用单引号：`resourceFilename == 'My New File.md'`。右侧是字面量，不会再被当成另一个上下文键。

`in` 的右侧是另一个上下文键，它的值应是数组或普通对象。对象看的是键在不在，不看值。

## 内置键（常用）

| 键 | 为真或有意义时 |
| --- | --- |
| `editorFocus` | 编辑器（文本或控件）有焦点 |
| `editorTextFocus` | 编辑器文本有焦点 |
| `editorHasSelection` | 有选区 |
| `editorReadonly` | 只读 |
| `editorLangId` | 当前语言，用 `==` 比较 |
| `resourceScheme` / `resourceExtname` / `resourceLangId` | 当前资源的协议、扩展名、语言 |
| `isWeb` / `isMac` / `isWindows` / `isLinux` | 运行环境 |
| `workspaceFolderCount` | 工作区文件夹数量 |
| `inDebugMode` | 正在调试 |

完整列表不在文档里穷举。快捷键编辑器里可以搜，也可以用 Inspect Context Keys 看当前位置有哪些键。

## 菜单不出现时先查

1. 命令 ID 在 `contributes.commands` 和 `registerCommand` 里是否同一个。
2. `menus` 是否挂到了正确的菜单 ID。
3. `when` 里的键现在是不是真值。用 Inspect Context Keys 看。
4. 视图标题按钮还要看视图有没有贡献、`when` 是否要求某个自定义键。

## 参考

- https://code.visualstudio.com/api/references/when-clause-contexts

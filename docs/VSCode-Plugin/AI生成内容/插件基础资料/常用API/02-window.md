# vscode.window

当前窗口的界面：可见编辑器、消息、选择、输入，以及状态栏、终端、树、网页视图。

## 编辑器状态

| 成员 | 作用 |
| --- | --- |
| `activeTextEditor` | 当前活动文本编辑器，可能是 `undefined` |
| `visibleTextEditors` | 所有可见文本编辑器 |
| `onDidChangeActiveTextEditor` | 活动编辑器变了 |
| `onDidChangeVisibleTextEditors` | 可见集合变了 |
| `onDidChangeTextEditorSelection` | 选区变了。事件里有 `TextEditorSelectionChangeKind`，能区分键盘和鼠标 |
| `onDidChangeActiveColorTheme` | 主题变了 |
| `tabGroups` | 标签组，可关闭标签 |
| `state` / `onDidChangeWindowState` | 窗口是否获得焦点 |

笔记本编辑器有对应的 `activeNotebookEditor` 和可见范围事件。

## 询问用户

| 方法 | 作用 |
| --- | --- |
| `showInformationMessage` / `showWarningMessage` / `showErrorMessage` | 右下角消息。可带按钮，返回用户点的项 |
| `showQuickPick` | 列表选择。`canPickMany: true` 时返回数组 |
| `showInputBox` | 单行输入，可校验 |
| `showOpenDialog` / `showSaveDialog` | 系统打开、保存对话框 |
| `showWorkspaceFolderPick` | 多根工作区里选一个文件夹 |
| `createQuickPick` / `createInputBox` | 要自己控制显示时机、动态改条目时用它们，而不是上面的一次性函数 |

这些 Thenable 在用户取消时解析为 `undefined`。耗时操作传入 `CancellationToken`。

## 打开与装饰

| 方法 | 作用 |
| --- | --- |
| `showTextDocument` | 打开文档到指定 `ViewColumn`，或只改变焦点 |
| `createTextEditorDecorationType` | 创建一类装饰（背景、边框、行尾文字）。具体范围用 `editor.setDecorations` |

## 状态栏、输出、终端

| 方法 | 作用 |
| --- | --- |
| `createStatusBarItem` | 状态栏一项。设置 `text`、`tooltip`、`command` 后 `show()` |
| `setStatusBarMessage` | 临时文字，可按超时或 Thenable 结束自动隐藏 |
| `createOutputChannel` | 输出面板。第二个参数 `{ log: true }` 得到带日志级别的 `LogOutputChannel` |
| `createTerminal` | 创建终端。传入 `ExtensionTerminalOptions` 时由扩展实现 `Pseudoterminal` |
| `onDidOpenTerminal` / `onDidCloseTerminal` | 终端开关 |
| `registerTerminalLinkProvider` | 终端里的可点击链接 |
| `registerTerminalProfileProvider` | 终端配置档案 |

## 树、网页、其他

| 方法 | 作用 |
| --- | --- |
| `registerTreeDataProvider` | 给已贡献的视图 ID 提供树数据 |
| `createTreeView` | 同上，并返回 `TreeView`，才能 `reveal`、读选中 |
| `createWebviewPanel` | 编辑器区网页面板 |
| `registerWebviewViewProvider` | 侧栏网页视图 |
| `registerWebviewPanelSerializer` | 重启后恢复网页面板 |
| `registerCustomEditorProvider` | 自定义编辑器 |
| `registerUriHandler` | 处理 `vscode://` 打开 |
| `registerFileDecorationProvider` | 资源管理器里文件的徽章和颜色 |
| `withProgress` | 通知或状态栏上的进度条 |

## 参考

- https://code.visualstudio.com/api/references/vscode-api
- https://code.visualstudio.com/api/extension-guides/tree-view
- https://code.visualstudio.com/api/extension-guides/webview

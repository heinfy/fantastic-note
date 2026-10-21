# vscode.workspace

当前工作区：打开了哪些文件夹、有哪些文本文档、配置、文件系统和文件事件。

没有打开文件夹时，`workspaceFolders` 为 `undefined`。官方说明部分能力会减弱，但仍然可以打开和编辑文本。

## 状态

| 成员 | 作用 |
| --- | --- |
| `workspaceFolders` | 0 到 N 个文件夹。没有工作区时是 `undefined` |
| `workspaceFile` | `.code-workspace` 的 `Uri`。单文件夹或未打开时是 `undefined` |
| `name` | 工作区名称 |
| `textDocuments` | 编辑器已知的文本文档，不限于当前可见 |
| `notebookDocuments` | 已知的笔记本 |
| `fs` | 文件系统。`fs.readFile`、`writeFile`、`readDirectory`、`stat`、`createDirectory`、`delete`、`rename`、`copy` |
| `isTrusted` | 用户是否已信任这个工作区 |

`rootPath` 已废弃。

## 查找与监听文件

| 方法 | 作用 |
| --- | --- |
| `findFiles` | 按 glob 找文件，在编辑器进程外跑 |
| `createFileSystemWatcher` | 监听创建、修改、删除。同样不要用 Node `fs.watch` 代替 |
| `asRelativePath` | 转成相对工作区的路径 |
| `getWorkspaceFolder` | 某个 `Uri` 属于哪个文件夹 |
| `openTextDocument` | 按 `Uri` 或语言加内容打开文档对象，不一定显示出来 |
| `save` / `saveAll` | 保存 |
| `applyEdit` | 应用 `WorkspaceEdit` |

`onDidCreateFiles`、`onDidDeleteFiles`、`onDidRenameFiles` 以及对应的 `onWill*` 来自用户操作和 `applyEdit`。磁盘被其他程序改动、或直接调用 `workspace.fs`，不会发这些事件。监听磁盘用 `FileSystemWatcher`。

## 文档事件

| 事件 | 作用 |
| --- | --- |
| `onDidOpenTextDocument` / `onDidCloseTextDocument` | 文档打开或关闭。关标签不保证触发关闭事件 |
| `onDidChangeTextDocument` | 内容或脏状态变化 |
| `onWillSaveTextDocument` / `onDidSaveTextDocument` | 保存前可追加编辑，保存后通知 |
| `onDidChangeWorkspaceFolders` | 增减文件夹。换掉第一个文件夹时宿主会重启，不会发这个事件 |

笔记本有一组对应事件。

## 配置

| 方法 | 作用 |
| --- | --- |
| `getConfiguration(section?, scope?)` | 读配置。按语言或按文件夹不同的项要传 scope |
| `onDidChangeConfiguration` | 任意配置变化。用 `affectsConfiguration` 过滤 |

## 其他注册

| 方法 | 作用 |
| --- | --- |
| `registerTextDocumentContentProvider` | 某个 scheme 的虚拟只读文档 |
| `registerFileSystemProvider` | 实现一种文件系统 scheme |
| `onDidGrantWorkspaceTrust` | 工作区从未信任变为已信任 |

## 参考

- https://code.visualstudio.com/api/references/vscode-api
- https://code.visualstudio.com/docs/editor/workspaces

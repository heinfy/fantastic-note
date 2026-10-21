# vscode.languages

参与某种语言的编辑功能：补全、诊断、悬停、代码操作等。编辑器负责界面，扩展按 `DocumentSelector` 提供数据。

选择器可以是语言 ID，或 `{ language, scheme, pattern, notebookType }`。`match(selector, document)` 返回分数，大于 0 才匹配。`*` 为 5，精确或 glob 命中为 10。

## 诊断与语言列表

| 方法 | 作用 |
| --- | --- |
| `createDiagnosticCollection(name?)` | 创建诊断集合。`set` 替换某个 `Uri` 的诊断，`delete` 清掉，`clear` 清空 |
| `getDiagnostics(uri?)` | 读取当前全部诊断 |
| `onDidChangeDiagnostics` | 全局诊断集合变化 |
| `getLanguages()` | 已知语言 ID |
| `setTextDocumentLanguage` | 改一份文档的语言 |
| `createLanguageStatusItem` | 状态栏语言区域里的一项 |
| `match` | 计算选择器和文档的匹配分数 |

## 注册提供器

每个函数都是 `(selector, provider) => Disposable`。多家可以并存。一家失败不会让整次请求失败。

| 方法 | 功能 |
| --- | --- |
| `registerCompletionItemProvider` | 补全。后面可跟触发字符 |
| `registerInlineCompletionItemProvider` | 行内补全 |
| `registerHoverProvider` | 悬停 |
| `registerSignatureHelpProvider` | 参数签名 |
| `registerDefinitionProvider` | 定义 |
| `registerDeclarationProvider` | 声明 |
| `registerTypeDefinitionProvider` | 类型定义 |
| `registerImplementationProvider` | 实现 |
| `registerReferenceProvider` | 引用 |
| `registerDocumentHighlightProvider` | 文档内高亮同一符号 |
| `registerDocumentSymbolProvider` | 符号、大纲 |
| `registerWorkspaceSymbolProvider` | 工作区符号搜索 |
| `registerCodeActionsProvider` | 代码操作。metadata 说明提供哪些 kind |
| `registerCodeLensProvider` | CodeLens |
| `registerDocumentLinkProvider` | 文档里的链接 |
| `registerColorProvider` | 颜色选择 |
| `registerDocumentFormattingEditProvider` | 全文档格式化 |
| `registerDocumentRangeFormattingEditProvider` | 选区格式化 |
| `registerOnTypeFormattingEditProvider` | 打某个字符时格式化 |
| `registerRenameProvider` | 重命名 |
| `registerFoldingRangeProvider` | 折叠 |
| `registerSelectionRangeProvider` | 扩大/缩小选区 |
| `registerCallHierarchyProvider` | 调用层次 |
| `registerTypeHierarchyProvider` | 类型层次 |
| `registerDocumentSemanticTokensProvider` | 语义着色 |
| `registerLinkedEditingRangeProvider` | 链接编辑，例如同时改标签名 |
| `registerInlayHintsProvider` | 内嵌提示 |
| `setLanguageConfiguration` | 括号、注释符号、缩进规则。返回 `Disposable` |

提供器方法签名一般是 `(document, position, token)` 或 `(document, token)`，返回结果或 `Thenable`。

## 补全的顺序

多家补全提供器先按匹配分数排序。分数相同的一组会按顺序被询问，这一组里有人返回了结果，就可以不再问更低分的组。触发字符只询问注册了该字符的提供器。触发字符应避开单词字符，常见的是 `.`。

## 参考

- https://code.visualstudio.com/api/references/vscode-api
- https://code.visualstudio.com/api/language-extensions/programmatic-language-features

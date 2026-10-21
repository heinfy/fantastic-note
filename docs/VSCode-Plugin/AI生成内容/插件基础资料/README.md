# VS Code 插件基础资料

这里汇总 Visual Studio Code 扩展开发里最常用的基础概念、API 和术语。内容根据官方文档整理，查阅日期为 2026-10-14。官方页面会随版本更新，写代码时以本机 `@types/vscode` 和 [Extension API](https://code.visualstudio.com/api) 为准。

从 VS Code 1.74 起，自己贡献的命令、语言、视图等会隐式激活扩展，多数场景不用再手写对应的 `onCommand` / `onLanguage` / `onView`。面向更老版本时仍要显式声明。

## 基础概念

| 文件 | 内容 |
| --- | --- |
| [扩展是什么](./基础概念/01-扩展是什么.md) | 扩展做什么、跑在哪、不能碰什么 |
| [扩展清单](./基础概念/02-扩展清单.md) | `package.json` 里和扩展相关的字段 |
| [激活与销毁](./基础概念/03-激活与销毁.md) | `activate` / `deactivate` 何时调用 |
| [激活事件](./基础概念/04-激活事件.md) | 什么时候才把扩展加载进来 |
| [贡献点](./基础概念/05-贡献点.md) | 清单里的静态声明 |
| [命令与菜单](./基础概念/06-命令与菜单.md) | 命令标识、命令面板、菜单 |
| [上下文键与 when 子句](./基础概念/07-上下文键与when子句.md) | 菜单和视图何时出现 |
| [配置](./基础概念/08-配置.md) | 设置项的声明、读取和监听 |
| [工作区文档与文件系统](./基础概念/09-工作区文档与文件系统.md) | 工作区、文档、编辑、虚拟文件 |
| [语言功能](./基础概念/10-语言功能.md) | 补全、悬停、诊断等提供器 |
| [语言服务器协议](./基础概念/11-语言服务器协议.md) | 为什么把语言能力拆到独立进程 |
| [树视图](./基础概念/12-树视图.md) | 侧栏树的声明和数据提供 |
| [网页视图](./基础概念/13-网页视图.md) | Webview 面板、侧栏视图和安全边界 |
| [扩展宿主与远程网页](./基础概念/14-扩展宿主与远程网页.md) | local / web / remote 宿主和 `extensionKind` |
| [资源释放与取消](./基础概念/15-资源释放与取消.md) | `Disposable`、订阅和取消令牌 |

## 常用 API

| 文件 | 内容 |
| --- | --- |
| [commands](./常用API/01-commands.md) | 注册和执行命令 |
| [window](./常用API/02-window.md) | 编辑器、消息、快速选择、状态栏、树和网页 |
| [workspace](./常用API/03-workspace.md) | 文件夹、配置、文档、文件系统 |
| [languages](./常用API/04-languages.md) | 语言功能注册和诊断集合 |
| [核心类型](./常用API/05-核心类型.md) | `Uri`、`Position`、`Range`、`Selection` 等 |
| [事件与取消](./常用API/06-事件与取消.md) | `Event`、`EventEmitter`、`CancellationToken` |
| [环境扩展与状态](./常用API/07-环境扩展与状态.md) | `env`、`extensions`、`ExtensionContext` |
| [诊断与代码操作](./常用API/08-诊断与代码操作.md) | `Diagnostic`、`CodeAction`、`WorkspaceEdit` |
| [终端任务调试与源码管理](./常用API/09-终端任务调试与源码管理.md) | `Terminal`、`tasks`、`debug`、`scm` |
| [认证与语言模型](./常用API/10-认证与语言模型.md) | `authentication`、`lm`、`chat` |

## 专业术语

每个术语单独一个文件，放在 [专业术语](./专业术语/README.md)。

## 主要来源

- [Extension Anatomy](https://code.visualstudio.com/api/get-started/extension-anatomy)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Activation Events](https://code.visualstudio.com/api/references/activation-events)
- [Contribution Points](https://code.visualstudio.com/api/references/contribution-points)
- [VS Code API](https://code.visualstudio.com/api/references/vscode-api)
- [Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host)
- [when clause contexts](https://code.visualstudio.com/api/references/when-clause-contexts)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [Tree View API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Programmatic Language Features](https://code.visualstudio.com/api/language-extensions/programmatic-language-features)
- [Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)

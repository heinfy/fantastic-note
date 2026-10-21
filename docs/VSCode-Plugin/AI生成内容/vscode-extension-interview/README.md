# VS Code 与插件如何通信（结合 hardware-core-monitor）

本目录说明 **VS Code 界面** 和 **本插件代码（Extension Host）** 之间如何配合。示例均来自本仓库 `src/` 与 `package.json`，**不包含 Webview 里的 postMessage**（Webview 见 `dashboardPanel.ts` / `webview2Panel.ts`，另述）。

## 插件从哪里启动

| 文件 | 作用 |
|------|------|
| `package.json` → `"main": "./out/extension.js"` | 编译后的入口 |
| `package.json` → `activationEvents: ["onStartupFinished"]` | VS Code 启动完成后加载插件 |
| `src/extension.ts` → `activate(context)` | 注册命令、树视图、监听事件 |

插件跑在 **Extension Host**（独立 Node 进程），不能直接操作 VS Code 界面 DOM，只能通过 `import * as vscode from "vscode"` 里的 API 和 VS Code 通信。

## 本项目的通信一览

```
VS Code 界面                         Extension Host（本插件）
─────────────────────────────────────────────────────────────
侧栏标题 [刷新][开始][暂停]  ──command──►  registerCommand 回调
用户改设置 refreshIntervalMs ──event────►  onDidChangeConfiguration
侧栏显示/隐藏               ──event────►  treeView.onDidChangeVisibility
需要画侧边栏树              ◄──pull────   getChildren / getTreeItem
树数据变了                  ◄──push────   onDidChangeTreeData.fire()
状态栏文字                  ◄──────────   StatusBarItem.text / show()
Play/Pause 按钮显隐         ◄──context──  setContext + package.json when
```

## 文档列表（按推荐阅读顺序）

| 文档 | 内容 |
|------|------|
| [01-commands.md](./01-commands.md) | `registerCommand`、`executeCommand`、`package.json` 里的 commands/menus |
| [02-events.md](./02-events.md) | `onDidChangeConfiguration`、`onDidChangeVisibility` |
| [03-ui-providers.md](./03-ui-providers.md) | `createTreeView`、`TreeDataProvider`、`createStatusBarItem` |
| [04-configuration.md](./04-configuration.md) | `getConfiguration`、`contributes.configuration` |
| [05-context-keys-and-when.md](./05-context-keys-and-when.md) | `setContext`、`when`、`viewsWelcome` |
| [06-internal-event-bus.md](./06-internal-event-bus.md) | `MonitorService` 的 `EventEmitter` 与 `extension.ts` 里的订阅 |
| [event-emitter-demo.md](./event-emitter-demo.md) | `EventEmitter` 最小 Demo（Counter + 命令） |

## 一条完整数据流（无 Webview）

1. 侧栏可见 → `extension.ts` 里 `monitorService.start()` 开始采集。
2. 采集完成 → `monitorService.ts` 里 `_onDidChangeSnapshot.fire(snapshot)`。
3. `extension.ts` 订阅回调 → 调用 `treeProvider.update`、`statusBar.update`、`alerter.update`。
4. `hardwareTreeProvider.ts` → `setContext('hardwareMonitorHasData')` + `onDidChangeTreeData.fire()` → VS Code 重新问树要节点并绘制。
5. `statusBarController.ts` → 改 `item.text` 并 `show()` → VS Code 画状态栏。

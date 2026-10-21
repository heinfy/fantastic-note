# 如何升级 Electron 大版本？有哪些坑和排查思路？

## 考察点

- 大版本升级的方法论
- 对 Electron 演进历史的了解（体现长期维护经验）

## 参考答案

### 1. 升级前的信息收集

每个大版本升级要读三样东西：

1. **官方 Breaking Changes 文档**（electronjs.org/docs/latest/breaking-changes）：列出所有废弃/行为变更 API
2. **Release Notes**：Chromium 和 Node.js 的升级版本号（如 Electron 28 = Chromium 120 + Node 18）
3. **项目依赖的第三方库兼容性**：electron-builder、electron-updater、原生模块是否支持目标版本

### 2. 典型的 Breaking Change（历史高频考点）

| 版本 | 变更 |
|------|------|
| Electron 5 | `remote` 模块标记废弃的开始 |
| Electron 12 | **contextIsolation 默认改为 true**（大量老项目渲染进程白屏的元凶） |
| Electron 14 | **remote 模块彻底移除**，需迁移到 @electron/remote 或 IPC 重写 |
| Electron 17 | desktopCapturer 等 API 移到主进程 |
| Electron 20 | **渲染进程默认 sandbox**（无 preload 时） |
| Electron 25+ | protocol.registerFileProtocol 等旧协议 API 废弃，迁移到 `protocol.handle` |
| Electron 28 | 支持 ESM 入口 |
| Electron 32 | `File.path` 移除，迁移到 `webUtils.getPathForFile` |

### 3. 标准升级流程

```bash
# 1. 升级依赖（electron 与配套生态一起升）
npm install electron@latest electron-builder@latest electron-updater@latest

# 2. 重建原生模块（ABI 版本变了必须重编译）
npx electron-rebuild -f

# 3. 全量回归测试
```

**（1）原生模块重编译是第一大坑**
- Electron 的 Node ABI 与官方 Node 不同，每个 Electron 大版本 ABI 都可能变
- 用 prebuild 的原生模块要确认有对应版本的预编译产物，否则要本地 node-gyp 编译（需要构建环境：Windows 要 VS Build Tools，macOS 要 Xcode CLT）

**（2）Chromium 升级带来的隐性变化**
- CSS 行为/新 Web API/废弃 Web API（如某些旧语法报错）
- 安全策略收紧（CORS、混合内容、三方 cookie）
- GPU 渲染行为变化（个别机器花屏/黑屏，需要 `--disable-gpu` 降级开关）

**（3）Node 升级带来的变化**
- 废弃 API、更严格的错误、ESM 行为变化

### 4. 测试策略

- **自动化回归**：Spectron 已废弃，现标准是 **Playwright**（官方支持 Electron）：

```js
// Playwright 测试 Electron
const { _electron: electron } = require('playwright');

const app = await electron.launch({ args: ['.'] });
const window = await app.firstWindow();
await window.click('#login-btn');
await app.close();
```

- **分层验证清单**：
  1. 启动/窗口/托盘基本链路
  2. IPC 全链路（preload 桥接）
  3. 自动更新（新旧版本互更测试：旧版能否更新到新版）
  4. 系统集成（自启、协议唤起、通知）
  5. 原生模块功能
  6. 各平台 + 各架构（mac arm64/x64、Windows）
- **灰度发布兜底**：先 beta 通道小范围，观察崩溃率再全量

### 5. 务实建议

- **不要跨太多版本跳**：从 12 直接升 30 是灾难，建议逐级或跨 2-3 个大版本，逐步消化 breaking changes
- **跟随 LTS 节奏**：Electron 每个大版本维护周期有限，选活跃维护线（官方同时维护最近 3 个大版本）
- **锁定版本**：package.json 用精确版本而不是 ^，升级是显式决策
- **升级单独成 PR/版本**：不与大功能需求混合发布，出问题好归因

## 面试话术

> 升级方法论：先读 breaking changes 和 Chromium/Node 版本变化，electron-rebuild 重建原生模块是必选项，然后用 Playwright 做自动化回归，重点验证 IPC、更新链路、系统集成和原生模块。历史大坑是 12 的 contextIsolation 默认开启和 14 的 remote 移除。原则上不跨多个大版本跳级，升级发布走灰度。

## 常见追问

- **怎么知道项目里用了哪些已废弃 API？** 开启 `process.traceDeprecation` 跑一遍全功能；全局搜索 deprecated 列表里的 API 名。
- **升级后性能劣化怎么查？** 对比新旧版本的 Chromium tracing（`contentTracing`）、启动耗时埋点，常见根因是 GPU 行为变化或新安全策略。

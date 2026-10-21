# Electron 版本和 Chromium、Node 的对应关系是什么？升级时先看哪三样？

## 考察点

- 知道 Electron 不是一个独立运行时，而是三套版本绑在一起
- 大版本升级的排查顺序

## 参考答案

### 1. 版本关系

一个 Electron 版本号同时锁定三样东西：

```
Electron 28.x  ≈  Chromium 120  +  Node 18.x  +  自带的 V8
```

精确对应以官方 Release 为准（每个大版本的 release notes 第一段就写 Chromium 和 Node 版本）。应用里可以这样看：

```js
console.log(process.versions.electron);
console.log(process.versions.chrome);
console.log(process.versions.node);
```

含义：

- **Chromium** 决定 CSS、Web API、DevTools、GPU、安全策略（cookie、CORS、混合内容）
- **Node** 决定主进程能用哪些 API、原生模块的 ABI
- **Electron 自己的 breaking changes** 决定 `webPreferences` 默认值、废弃 API（remote、旧 protocol API、`File.path`）

所以“页面在 Chrome 正常、在咱们应用里不正常”，先对一下应用内的 Chromium 版本，而不是对用户电脑上的 Chrome。

### 2. 升级前看的三样

1. **Breaking Changes 文档**：废弃了哪些 Electron API，默认值变了没有（历史上 contextIsolation、sandbox 都改过默认值）
2. **这份 Electron 带的 Chromium / Node 版本**：Web 平台和 Node API 变了什么
3. **原生模块和打包链**：`electron-builder`、`electron-updater`、`better-sqlite3` 这类 `.node` 是否有对应 ABI 的预编译包

### 3. 升级动作

```bash
# 版本写死，升级是一次显式改动，不用 ^
npm install electron@32.2.0 --save-dev
npx electron-rebuild -f
```

然后按层回归：窗口能起来、preload 桥还在、自动更新能从旧版本装到新版本、原生模块能加载、macOS 签名公证还能过。

### 4. 不要跳太多大版本

从 12 直接到 32，中间会叠上：contextIsolation 默认开启、remote 删除、sandbox 默认收紧、`protocol.registerFileProtocol` 废弃、`File.path` 删除。每跨 2 到 3 个大版本停一次，比一次跨十个版本好查。

Electron 同时维护的大版本有限，生产环境跟在仍受安全更新的版本上，而不是停在某个“能跑就行”的老版本。

## 面试话术

> Electron 的版本号是 Chromium、Node、自身 API 三套锁定。页面兼容看 Chromium，原生模块看 Node ABI，升级事故多半出在自身 breaking changes。升级前对这三份说明，然后 electron-rebuild，再跑窗口、桥、更新和签名。不跨很多个大版本跳。

## 常见追问

- **用户机器上的 Chrome 版本重要吗？** 不重要。应用自带 Chromium，和系统 Chrome 无关。
- **怎么确认线上用户跑的是哪份运行时？** 启动时把 `process.versions` 打进日志和崩溃上报的 extra 字段。

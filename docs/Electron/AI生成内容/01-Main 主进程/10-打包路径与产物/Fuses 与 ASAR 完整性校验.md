# Fuses 是什么？RunAsNode、CLI Inspect、ASAR 完整性分别解决什么？

## 考察点

- Electron Fuses 的作用（把能力焊死在可执行文件上）
- 和“只改 asar”攻击方式的关系

## 参考答案

### 1. Fuses 是什么

Fuses 是写进 **Electron 可执行文件**里的一组开关，用 `@electron/fuses` 在打包时翻转。攻击者就算替换了 `app.asar`，也改不了这些位，除非他重新签名整个可执行文件（签名会失败）。

```js
const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');

await flipFuses(pathToElectronBinary, {
  version: FuseVersion.V1,
  // 禁止 ELECTRON_RUN_AS_NODE，避免可执行文件被当成 Node 解释器
  [FuseV1Options.RunAsNode]: false,
  // 禁止 --inspect 等调试参数
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  // 只从 asar 加载应用，忽略旁边散落的 app 目录
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
  // 启动时校验 asar 没有被改过
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
});
```

electron-builder 新版本可以在配置里声明同样的开关，不必手写脚本。开关在打包机上打，不要在用户机器上打。

### 2. 三个常考开关

**RunAsNode**  
环境变量 `ELECTRON_RUN_AS_NODE=1` 时，官方 Electron 二进制会变成 Node，从而执行攻击者的脚本，并继承应用签名。关掉之后这条路不通。

**EnableNodeCliInspectArguments**  
关掉 `--inspect`、`--inspect-brk`，避免别人给已经签过名的程序挂调试器。这不能代替渲染进程里关 DevTools，它管的是主进程调试参数。

**ASAR 完整性 + OnlyLoadAppFromAsar**  
有人把 `app.asar` 换掉或在旁边放一份未打包的 `app/` 让 Electron 优先加载。这两个开关要求只加载 asar，并在启动时核对哈希。校验失败就起不来。

### 3. 它防什么、不防什么

防的是：本机恶意程序或用户替换应用代码、把签名过的 Electron 当 Node 用。  
不防的是：阅读源码、渲染进程 XSS、主进程 IPC 没校验。完整性通过之后，有漏洞的代码照样执行。

macOS 上改可执行文件会破坏签名，还要配合公证。Windows 上要有代码签名，否则攻击者可以换掉整个 exe 再重新签自己的证书。

## 面试话术

> Fuses 把开关焊在可执行文件里，换 asar 改不掉。生产包我会关 RunAsNode 和 inspect 参数，并打开只从 asar 加载和完整性校验。这是防篡改，不是防看源码，也代替不了 IPC 校验和上下文隔离。

## 常见追问

- **开发时要开完整性校验吗？** 不要。开发态没有正式 asar，校验会让应用起不来。只在发布流水线里翻转。
- **和 crashpad、cookie 加密那些 Fuse 呢？** 还有 cookie 加密等开关。面试先把 RunAsNode、inspect、asar 完整性讲清楚即可。

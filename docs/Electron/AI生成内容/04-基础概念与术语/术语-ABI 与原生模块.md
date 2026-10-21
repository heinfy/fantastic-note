# ABI 与原生模块

原生模块是编译成 `.node` 的 Node 扩展，用来调用系统里 JavaScript 没有直接提供的能力。Electron 自带的 Node 和本机安装的 Node 往往不是同一个 ABI，所以用系统 Node 编译的 `.node` 不能直接放进 Electron。

## 重新编译

```bash
npx electron-rebuild -f
```

`electron-rebuild` 会按当前安装的 Electron 版本下载对应头文件并编译。依赖预编译包的库，则要提供 `electron`、平台和架构都匹配的文件。

N-API（node-addon-api）在 ABI 稳定的范围内可以减少“每升一个 Electron 就重编一次”。仍然要为 Windows、macOS arm64、macOS x64 分别准备二进制。

## 打包

`.node` 必须从 asar 中解出来（`asarUnpack`），因为加载动态库需要真实文件路径。macOS 公证时这些二进制也要签名。

原生模块只放在主进程或 utility 进程。渲染进程默认没有 Node，也不适合加载 `.node`。

## 相关文档

- [术语-ASAR](./术语-ASAR.md)
- [API-utilityProcess](./API-utilityProcess.md)

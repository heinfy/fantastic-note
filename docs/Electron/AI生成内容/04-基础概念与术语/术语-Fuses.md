# Fuses

Fuses 是写在 Electron 可执行文件里的一组开关。打包之后用 `@electron/fuses` 翻转。替换 `app.asar` 改不了这些字节；要改它们就要改二进制，从而破坏代码签名。

官方文档把相关字节称为：

- **Sentinel**：固定字符串 `dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX`，用来在二进制里找到开关区。
- **Fuse wire**：后面若干字节，每个字节一个开关。`0` 表示关，`1` 表示开，`r` 表示该开关已移除。

## 常见开关

| 开关 | 作用 |
|------|------|
| `RunAsNode` | 关闭后，不能再用 `ELECTRON_RUN_AS_NODE` 把应用当成 Node 解释器 |
| `EnableNodeCliInspectArguments` | 关闭后，忽略 `--inspect` 一类调试参数 |
| `EnableEmbeddedAsarIntegrityValidation` | 启动时核对 `app.asar` 的头哈希，不一致就退出 |
| `OnlyLoadAppFromAsar` | 只从 `app.asar` 加载应用代码，忽略旁边的散落目录 |

完整性校验默认关闭，在打包时打开。它要和 `OnlyLoadAppFromAsar` 一起用，否则可以从其他路径加载未校验的代码。macOS 和 Windows 上，哈希分别写进 `Info.plist` 和可执行文件资源。electron-builder、Electron Forge 的较新版本可以在打包时写入。

开发时不要打开完整性校验，因为那时还没有正式的 `app.asar`。

## 相关文档

- [术语-ASAR](./术语-ASAR.md)
- [概念-安全模型](./概念-安全模型.md)

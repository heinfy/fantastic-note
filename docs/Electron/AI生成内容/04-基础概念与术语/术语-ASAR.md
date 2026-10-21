# ASAR

ASAR 是 Electron 应用的归档格式。打包后，源码和静态资源通常放在一个 `app.asar` 文件里。Electron 修补过的 Node API 会把它当成目录：`require` 和 `fs.readFile` 可以直接读里面的路径。

官方列出的目的有三个：缓解 Windows 路径过长、加快大量小文件的 `require`、让源码不那么容易被随手翻到。用 `asar extract` 可以解出全部内容，所以它不是加密。

## 限制

- 归档是只读的，修改文件的 `fs` API 不能写回 asar。
- 不能把工作目录换到 asar 里面的“目录”。
- `fs.stat` 的结果是推算的，除了文件大小和类型，不要依赖其他字段。
- 需要把真实路径交给操作系统的调用，会先把文件抽到临时文件。`process.dlopen`（加载 `.node`）要求文件本来就在真实路径上，因此原生模块要 `asarUnpack`。
- 能执行 asar 内二进制的主要是 `child_process.execFile`。

要按单个文件读取 `app.asar` 本身（例如计算校验），使用 `original-fs`，否则补丁过的 `fs` 会把它当目录。

## 相关文档

- [术语-original-fs](./术语-original-fs.md)
- [术语-Fuses](./术语-Fuses.md)
- [概念-打包分发与自动更新](./概念-打包分发与自动更新.md)

# minidump

minidump 是进程崩溃时写下的小型转储文件，扩展名通常是 `.dmp`。里面有崩溃线程的寄存器、调用栈和加载的模块，没有完整的内存镜像。

`crashReporter.start` 之后，主进程或渲染进程发生原生崩溃，Electron 会生成 dump，并可以在下次启动时上传到 `submitURL`。JavaScript 里抛出的异常不会自动变成 minidump，除非它导致了进程终止。

要读懂 dump，需要该版本 Electron 和原生模块的符号文件。符号在打包时从构建机收集，按版本号存放。没有符号时，堆栈只显示地址。

本地文件位于 `app.getPath('crashDumps')`。分析工具常用 breakpad 的 `minidump_stackwalk`，或把 dump 交给 Sentry 一类已对接 Electron 的服务。

## 相关文档

- [API-crashReporter](./API-crashReporter.md)
- [概念-进程模型](./概念-进程模型.md)

# crashReporter

`crashReporter` 收集进程崩溃时的 minidump，并可以上传到你的服务器。它覆盖的是原生层崩溃，不是 `try/catch` 能接到的普通 JavaScript 异常。

文档：[https://www.electronjs.org/docs/latest/api/crash-reporter](https://www.electronjs.org/docs/latest/api/crash-reporter)

## 启动

在主进程入口尽早调用：

```js
const { crashReporter } = require('electron');

crashReporter.start({
  productName: 'MyApp',
  companyName: 'MyCompany',
  submitURL: 'https://crash.example.com/minidump',
  uploadToServer: true,
  extra: { channel: 'stable' },
});
```

主进程启动后，渲染进程会沿用这份配置。上传的文件需要对应版本的符号（breakpad 符号、dSYM 或 pdb）才能还原成可读堆栈。符号和该次发布的构建产物一起归档。

JavaScript 未捕获异常另外用 `process.on('uncaughtException')` 和 `unhandledRejection` 写日志。两类记录互补。

崩溃发生时进程已经退出，dump 常常在下次启动时才上传。本地还会留在崩溃目录里，可用 `app.getPath('crashDumps')` 查看。

## 相关文档

- [概念-进程模型](./概念-进程模型.md)
- [术语-minidump](./术语-minidump.md)

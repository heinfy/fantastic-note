# original-fs

`original-fs` 是 Electron 内置模块，提供没有 ASAR 补丁的 Node `fs`。平时的 `require('fs')` 会把 `app.asar` 里的路径当成目录项；`original-fs` 把 `app.asar` 看成磁盘上的一个文件。

```js
const fs = require('original-fs');
const data = fs.readFileSync(asarFilePath);
```

用它来计算整个归档的校验和，或把 `app.asar` 当作文件复制。业务代码读取归档里面的 `index.html` 时，继续用普通的 `fs`。

不要在渲染进程里使用它。它和普通 `fs` 一样属于 Node 能力，放在主进程。

## 相关文档

- [术语-ASAR](./术语-ASAR.md)

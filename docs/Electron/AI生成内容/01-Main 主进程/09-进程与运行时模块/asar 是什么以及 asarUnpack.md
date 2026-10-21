# asar 是什么？为什么不能当加密？.node 为什么必须 asarUnpack？

## 考察点

- asar 的真实能力边界（虚拟目录，不是加密）
- 打包后原生模块、可执行文件读不到的经典故障

## 参考答案

### 1. asar 是什么

打包后应用代码通常打进一个 `app.asar`。它是 Electron 专用的归档格式，运行时被补丁过的 Node `fs` / `require` **当成虚拟目录**来读：

```js
// 打包后这段仍然能读到 asar 里的文件
const html = fs.readFileSync(path.join(app.getAppPath(), 'index.html'), 'utf-8');
```

设计目的只有三件：

- 缓解 Windows 路径过长
- 减少大量小文件的 `require` 打开次数
- 让源码不那么容易被随手翻到

### 2. 为什么不能当加密

`npx asar extract app.asar ./out` 就能完整解出源码。没有密钥、没有完整性校验（完整性是 Fuses 的另一件事）。面试里说“asar 加密保护源码”是减分项。真正要防的是：

- 业务机密不要打进包里，放服务端
- 本地凭据用 `safeStorage`，不要硬编码
- 需要防篡改时开 ASAR 完整性校验（Fuses），那是防改包，不是防阅读

### 3. 什么时候必须 asarUnpack

操作系统要**真实文件路径**的操作，asar 虚拟路径不行。Electron 对一部分 API 会先解到临时文件再调用，但 `dlopen`（加载 `.node`）必须自己 unpack：

```json
{
  "build": {
    "asarUnpack": [
      "**/*.node",
      "resources/bin/**"
    ]
  }
}
```

典型必须解出的文件：

| 文件 | 原因 |
|------|------|
| `*.node` | `process.dlopen` 需要真实路径，否则打包后 `module not found` |
| 要被其他进程执行的 exe / 动态库 | 子进程、安装器、驱动看不到 asar |
| 需要被外部程序打开的模板 | 系统按真实路径打开 |

开发环境正常、打包后原生模块报错，第一嫌疑就是没 unpack。

### 4. original-fs

Electron 给 `fs` 打了 asar 补丁。要按“一个文件”读取 `app.asar` 本身（算校验和、拷贝整包），用 `original-fs`，否则 `fs.readFile('app.asar')` 会被当成目录。

### 5. 其他限制

- asar **不能写**。要持久化的数据放 `userData`，不要写回安装目录
- `fs.stat` 在 asar 内是估算的，别拿它做精确时间戳判断
- 不能把工作目录 `chdir` 到 asar 内部目录
- `child_process.execFile` 可以执行 asar 内的二进制（Electron 会抽到临时文件），`spawn` 不一定行

## 面试话术

> asar 是只读虚拟目录，为了少打开文件、躲 Windows 长路径，不是加密。解包一条命令的事。`.node` 和要被系统按真实路径打开的二进制必须 `asarUnpack`，这是“开发正常、打包报 module not found”的标准答案。需要读 asar 文件本体时用 `original-fs`。

## 常见追问

- **完整性校验和加密是一回事吗？** 不是。完整性只证明包没被改，源码照样能被解出来读。
- **unpack 的文件放哪？** `app.asar.unpacked`，和 `app.asar` 同级，目录结构保持相对路径。

# utilityProcess 和 child_process.fork 怎么选？

## 考察点

- 重活为什么不能放主进程
- Electron 官方子进程和 Node 子进程的差别

## 参考答案

### 1. 先定原则

主进程负责窗口、IPC、系统 API。CPU 重、解析大文件、压缩、扫描，都不要放主进程——它一卡，所有窗口的 IPC 一起卡。

两个可选的子进程：

| | `utilityProcess.fork` | `child_process.fork` |
|---|---|---|
| 来源 | Electron API（约 22+） | Node 自带 |
| 运行环境 | 带 Node 的 Chromium utility 进程 | 独立 Node 进程 |
| 通信 | `MessagePort` / `postMessage`，支持 transfer | IPC channel，`process.send` |
| 生命周期 | 跟随应用，父进程退出子进程退出 | 要自己管 `unref`、杀进程 |
| Electron API | 没有 `BrowserWindow`、`ipcMain` | 同样没有 |
| 网络 | 可指定 `session`，走应用的缓存和代理 | 走 Node 网络栈，不吃系统代理 |

### 2. utilityProcess 示例

```js
const { utilityProcess } = require('electron');

// 子进程脚本是纯 Node，不要 require('electron') 的 UI API
const child = utilityProcess.fork(path.join(__dirname, 'hash-worker.js'), [], {
  serviceName: 'hash-worker',
  stdio: 'pipe',
});

child.on('spawn', () => child.postMessage({ file: filePath }));
child.on('message', (msg) => {
  // 只把进度转给窗口，计算不经过主进程事件循环太久
  mainWindow?.webContents.send('hash:progress', msg);
});
child.stdout.on('data', (buf) => logger.info(buf.toString()));
```

子进程里：

```js
// hash-worker.js
process.parentPort.on('message', async (e) => {
  const digest = await hashFile(e.data.file);
  process.parentPort.postMessage({ digest });
});
```

需要和某个渲染进程高频传数据时，用 `MessageChannelMain` 把端口一边交给 utility 进程、一边交给窗口，主进程不再转发大块数据。

### 3. 什么时候仍用 child_process

- 要启动**外部可执行文件**（`spawn` 一个 CLI、安装器、系统命令），这不是 fork Node 脚本
- 依赖官方 Node 的行为，或要跑和 Electron ABI 无关的纯 Node 工具
- Electron 版本老，还没有 `utilityProcess`

`spawn` / `execFile` 跑外部程序时，参数用数组，不要把用户输入拼进 shell 字符串。

### 4. 选择口诀

- 应用内的 Node 重计算：`utilityProcess`
- 调系统命令或第三方 exe：`child_process.spawn` / `execFile`
- 和渲染进程之间的大流量：再加一条 `MessagePort`，不要让主进程当搬运工

## 面试话术

> 主进程只做调度。应用内的 Node 重活用 utilityProcess，它跟应用一起退出，通信用 MessagePort，还能挂上 session。启动外部程序才用 child_process.spawn，并且参数数组化，避免把子进程变成命令注入入口。

## 常见追问

- **子进程能用 better-sqlite3 吗？** 可以，但 `.node` 要按 Electron ABI 编译，并且 asarUnpack。多个进程不要同时写同一个 SQLite 文件，除非用 WAL 并接受锁。
- **子进程崩溃怎么办？** 监听 `exit`，非 0 退出按退避重启，并限制一分钟内的重启次数。

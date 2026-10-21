# 如何防止渲染进程伪造 IPC 消息/越权调用？

## 考察点

- IPC 是特权边界的认知
- senderFrame 校验、参数校验等防御手段

## 参考答案

### 1. 威胁模型

如果页面存在 XSS（或被加载的第三方脚本恶意），攻击者可以：
- 调用暴露的任何 IPC 通道（`invoke('file:read', '/etc/passwd')`）
- 传入构造的恶意参数（路径穿越、命令注入）
- 冒充其他窗口的身份（传入别的窗口 id）

**核心认知：IPC handler 就是"服务端接口"，渲染进程是"不可信客户端"**——所有 Web 后端的安全原则都适用。

### 2. 防线一：消息来源校验（senderFrame）

```js
ipcMain.handle('file:read', (event, filePath) => {
  // 校验消息发送者的 URL，只信任自己的页面
  const senderUrl = event.senderFrame.url;
  if (!senderUrl.startsWith('myapp://static/')) {
    throw new Error('untrusted sender');
  }
  // ...
});
```

- `event.senderFrame` 是发送消息的 frame，校验其 URL origin 可识别"消息是不是从我的应用页面发出的"
- 防止被加载的第三方页面/iframe 调用特权通道
- 不要用 `event.sender` 的 id 做信任判断（id 可以拿到），要校验 URL

### 3. 防线二：参数严格校验（白名单思维）

```js
const { z } = require('zod');

// 用 schema 定义合法输入
const FileReadSchema = z.object({
  // 只允许相对路径，且限定在数据目录
  relativePath: z.string().regex(/^[\w\-./]+$/).refine(
    (p) => !p.includes('..'), // 拒绝路径穿越
    'path traversal'
  ),
});

ipcMain.handle('file:read', async (event, rawInput) => {
  const input = FileReadSchema.parse(rawInput); // 不合规直接抛错
  const absPath = path.resolve(DATA_DIR, input.relativePath);
  if (!absPath.startsWith(DATA_DIR + path.sep)) throw new Error('forbidden');
  return fs.readFile(absPath, 'utf-8');
});
```

原则：
- 能传 id 就不传路径（id → 服务端查表得路径，渲染进程永远接触不到文件系统语义）
- 能枚举就不用自由文本（action 用联合类型白名单）
- 字符串参数假设它包含任何字符

### 4. 防线三：能力按窗口绑定

```js
// 不信任渲染进程传入的窗口 id——从 event 反查
ipcMain.handle('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender); // 只关自己
  win?.close();
});

// ❌ 危险：渲染进程传入任意 windowId，可以操作别的窗口
ipcMain.handle('window:close', (event, windowId) => {
  BrowserWindow.fromId(windowId)?.close();
});
```

通用原则：**身份信息从 event 推导，绝不信任参数里的"我是谁"**。

### 5. 防线四：通道收敛与分级

- preload 层收敛：页面只能调语义化 API（`api.user.get()`），通道名不出现在渲染进程代码里
- 高危通道（执行命令、写文件）单独审查，能不暴露就不暴露
- 渲染进程崩溃/被控后的影响面评估：假设 invoke 会被任意调用，每条通道"最坏能干什么"

### 6. 审计方法

```bash
# 项目里搜出所有 handler，逐条人工过
grep -rn "ipcMain.handle\|ipcMain.on" src/main/
```

每条 handler 问三个问题：
1. 校验 sender 了吗？
2. 参数最坏情况是什么？
3. 这个能力真的需要暴露给渲染进程吗？

## 面试话术

> 把 IPC handler 当服务端接口防：senderFrame.url 校验来源身份；zod schema 做参数白名单校验，能传 id 不传路径；窗口/身份类信息从 event 反查而非信参数；preload 收敛通道暴露面。定期审计所有 handler，每条问"最坏能干什么"。

## 常见追问

- **contextIsolation 都开了，页面还能伪造吗？** 能——页面合法持有桥接 API，恶意脚本（XSS）可以"合法"调用它们。隔离防的是页面碰 preload 内部，防不了页面"使用"暴露的 API。
- **event.sender.id 可靠吗？** 由主进程分配，本身可靠，但渲染进程可能拿到别的窗口 id 传进参数，所以要用 fromWebContents(event.sender) 反查而不是信参数。

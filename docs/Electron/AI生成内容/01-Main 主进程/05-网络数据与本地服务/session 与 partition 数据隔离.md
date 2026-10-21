# session 是什么？partition 如何实现多账号数据隔离？

## 考察点

- session 的概念与体系
- partition 实现多开的原理

## 参考答案

### 1. session 的概念

`session` 是 Electron 中管理**网络与存储状态**的对象，每个 session 独立持有：
- Cookies
- 缓存（HTTP cache）
- localStorage / IndexedDB 等 DOM Storage
- 代理设置、证书配置
- webRequest 拦截器、协议处理器

可以把 session 理解为 Chrome 的"用户配置文件（Profile）"：不同 session 之间数据完全隔离。

### 2. session 的获取方式

```js
const { session } = require('electron');

// 默认 session（所有未指定 partition 的窗口共享）
session.defaultSession;

// 按 partition 获取/创建
const ses1 = session.fromPartition('account:userA');      // 内存 session，关闭即失
const ses2 = session.fromPartition('persist:account:userA'); // 持久化 session，落盘保存

// 从某个 webContents 反查
win.webContents.session;
```

窗口绑定 session 的方式：

```js
new BrowserWindow({
  webPreferences: {
    partition: 'persist:account:userA', // 该窗口使用独立 session
  },
});
```

### 3. partition 的规则

- **不带 `persist:` 前缀**：内存 session，应用退出后数据清空（类似无痕模式）
- **带 `persist:` 前缀**：持久化到磁盘（userData/Partitions 目录下）
- 相同 partition 名的窗口**共享** session；不同 partition 完全隔离

### 4. 典型应用：多账号同时登录

```js
// 每个账号一个窗口，各自独立 cookie/localStorage
function openAccountWindow(accountId) {
  return new BrowserWindow({
    webPreferences: {
      partition: `persist:account:${accountId}`, // 按账号隔离
    },
  });
}
```

这就是"多开微信/多开电商后台"类需求的原理——本质是模拟多个浏览器 Profile。

### 5. session 的其他高频用途

**（1）清理数据**

```js
const ses = session.fromPartition('persist:account:userA');
await ses.clearStorageData();  // 退出登录时清掉该账号所有本地数据
await ses.clearCache();
```

**（2）按 session 挂拦截器**

```js
// 只拦截某个账号窗口的请求
ses.webRequest.onBeforeSendHeaders((details, callback) => {
  details.requestHeaders['X-Source'] = 'desktop-agent';
  callback({ requestHeaders: details.requestHeaders });
});
```

**（3）按 session 设置代理**

```js
await ses.setProxy({ proxyRules: 'http://127.0.0.1:8888' }); // 只影响该 session
```

### 6. 注意点

1. partition 字符串在窗口创建后**不可更改**，换账号要新建窗口
2. `defaultSession` 上挂的拦截器影响面大，agent 多账号场景要克制
3. session 数据目录随 userData 走，卸载残留清理要注意 Partitions 目录
4. 同一 partition 的多个窗口共享 cookie 也意味着**竞态**（两个窗口同时改 localStorage）

## 面试话术

> session 等价于浏览器 Profile，partition 是创建独立 session 的钥匙：persist 前缀决定持久化还是内存态。多账号方案就是每账号一个 persist partition，配合按 session 清理数据实现退出登录。进阶操作（拦截器、代理、协议）都要意识到它们是 session 粒度而非全局。

## 常见追问

- **persist partition 的数据存哪？** `userData/Partitions/<partition名>/` 目录下。
- **webview 和 BrowserWindow 的 session 一致吗？** 取决于各自 webPreferences 的 partition，可同可不同。

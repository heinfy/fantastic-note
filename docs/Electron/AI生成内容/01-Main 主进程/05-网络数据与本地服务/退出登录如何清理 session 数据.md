# 退出登录时 session.clearStorageData 清的是什么？

## 考察点

- cookie、缓存、localStorage 不在同一层
- 多 partition 时清错范围

## 参考答案

### 1. 两套 API

```js
const ses = session.fromPartition('persist:account:userA');

await ses.clearStorageData({
  storages: [
    'cookies',
    'localstorage',
    'indexdb',
    'serviceworkers',
    'cachestorage',
  ],
});

await ses.clearCache();
```

`clearStorageData` 清的是站点存储：cookie、localStorage、IndexedDB、Service Worker、Cache Storage。  
`clearCache` 清的是 HTTP 缓存。只清 cookie 不清 HTTP 缓存时，下一秒仍可能看到旧图片和旧接口响应。

不传 `storages` 会按默认集合清。退出登录建议把要用的项写明，避免以后默认值变化时不知道清了什么。

### 2. 清哪个 session

窗口如果用了 `partition: 'persist:account:userA'`，数据不在 `defaultSession` 里。对 `defaultSession` 调用清干净了，账号窗口仍是登录态。退出时清这个账号的 partition，而不是无脑清默认 session。

内存 partition（没有 `persist:` 前缀）进程退出就没了，不必当持久登录态来清。

### 3. 清完之后

- 已打开窗口里的 JS 变量还在。清存储后要 `reload` 或关掉账号窗口，否则内存里的 token 还在发请求
- 主进程如果把 token 放在闭包或 safeStorage 里，要一并删掉。session 清理碰不到那些
- 不要在页面里用 `localStorage.clear()` 代替主进程清理，那清不到 cookie 和 HTTP 缓存

### 4. 切换账号

切换不要复用同一个 partition 再清。每个账号独立 `persist:` partition，切账号就是关旧窗口、开新窗口。清数据只发生在“退出并忘掉这台设备”。

## 面试话术

> 退出登录要清对应 partition 的 clearStorageData 和 clearCache，cookie 和 HTTP 缓存是分开的。清的是这个 session，不是 defaultSession。清完重载窗口，并删掉主进程里单独存的刷新令牌。切账号用另一份 partition，而不是清完再登。

## 常见追问

- **能只清一个域名的 cookie 吗？** 可以。`session.cookies.remove(url, name)` 或 `clearStorageData` 的 `origin` 选项，适合退出某一个站点而保留本地应用自己的存储。
- **Service Worker 没清掉会怎样？** 旧 worker 还会拦截请求，看起来像没退出。所以 storages 里带上 `serviceworkers`。

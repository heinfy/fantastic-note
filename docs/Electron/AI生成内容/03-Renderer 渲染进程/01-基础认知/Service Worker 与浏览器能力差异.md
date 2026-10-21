# Electron 里的 Service Worker、通知权限、自动填充和 Chrome 有什么不同？

## 考察点

- 不要把浏览器里能用的能力原样假设到 Electron
- 本地协议要额外开特权

## 参考答案

### 1. Service Worker

Chromium 支持 Service Worker，但页面如果是 `file://`，注册会失败。要用自定义协议，并在 `registerSchemesAsPrivileged` 里把该 scheme 配成标准、安全、支持 fetch 的源。

桌面应用的离线能力通常不需要 Service Worker：资源本来就在安装包里。用它做缓存时，退出登录必须 `clearStorageData` 带上 `serviceworkers` 和 `cachestorage`，否则旧 worker 继续拦截请求。

开发时 worker 缓存很容易让你看到旧页面。本地应用优先关缓存或在开发态不注册。

### 2. 通知权限

页面里的 `Notification.requestPermission()` 不会弹出和 Chrome 一样可靠的条。主进程要在 `setPermissionRequestHandler` 里对 `notifications` 表态。后台提醒更直接用主进程的 `Notification` 模块，不依赖页面没被回收。

### 3. 自动填充和翻译

Chrome 的密码自动填充、翻译、账号同步不在 Electron 里。输入框不会有浏览器那套密码气泡。要记密码就自己做，并且秘密放在主进程的 `safeStorage`，不要学习浏览器把密码放进渲染进程的存储。

拼写检查是有的，`webPreferences.spellcheck` 默认开着，会带来词典下载和右键菜单项。不需要就关掉。

### 4. 扩展

`session.loadExtension` 能加载一部分扩展，不是完整的 Chrome 网上应用店环境，Manifest V3 的能力也不齐全。产品功能不要建立在“用户自己装扩展”上。

## 面试话术

> 运行的是 Chromium，但不是 Chrome。file 协议注册不了 Service Worker，本地应用也通常不需要它；真用了，退出登录要把 worker 和 cache storage 清掉。网页通知要权限 handler，后台通知放主进程。没有浏览器的密码填充和翻译，凭据自己用 safeStorage 管。

## 常见追问

- **PWA 安装在 Electron 里有意义吗？** 没有。你已经是安装包了。不要再做一套 beforeinstallprompt。
- **IndexedDB 能用吗？** 能，和 Chrome 类似，但是按 session / partition 隔离。清数据时记得带上。

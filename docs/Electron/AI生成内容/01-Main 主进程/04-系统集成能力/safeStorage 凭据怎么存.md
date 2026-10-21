# 凭据怎么存？safeStorage 和系统钥匙串是什么关系？

## 考察点

- 本地秘密不能明文进 json
- safeStorage 的平台能力和失效场景

## 参考答案

### 1. 它做什么

`safeStorage` 用操作系统的加密能力把字符串变成一串密文，你可以用自己的方式存到磁盘：

- macOS：钥匙串
- Windows：DPAPI，和当前用户绑定
- Linux：gnome-libsecret 或 kwallet；桌面环境对不上时，可能要退回较弱的实现

```js
const { safeStorage } = require('electron');

function seal(plain) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('当前系统不能加密存储');
  }
  // 返回 Buffer，自己写入 userData 下的文件
  return safeStorage.encryptString(plain);
}

function open(buffer) {
  return safeStorage.decryptString(buffer);
}
```

优先用异步的 `encryptStringAsync` / `decryptStringAsync`（新版本提供）。它们不堵主进程，并且能表示密钥暂时不可用。同步 API 在钥匙串弹窗时可能卡住启动。

### 2. 适合存什么

刷新令牌、本地数据库 passphrase、代理密码。  
不适合把加密后的密文再交给渲染进程长期放着。渲染进程只在登录成功后拿到短期 access token。

electron-store 或 json 里可以存密文 Buffer 的 base64，不要存明文 token。

### 3. Linux 和可用性

调用前看 `isEncryptionAvailable()`。Linux 没有可用的密钥环时，`setUsePlainTextEncryption(true)` 会退成内存口令，**重启就解不开，也不能当成真加密**。这种环境应提示用户，而不是静默明文落盘。

换机器、换系统用户、钥匙串被重置后，旧密文解不开。流程要能回到重新登录，不能因为解密失败就崩溃循环。

### 4. 和 keytar 的关系

keytar 直接读写钥匙串条目。`safeStorage` 是 Electron 自带的“加密一段字符串”。新项目优先用自带的 `safeStorage`，少一个原生依赖。需要按账号列出钥匙串项时才考虑别的库。

## 面试话术

> 刷新令牌这类秘密用 safeStorage 加密后放 userData，密钥在系统钥匙串或 DPAPI 里，不进仓库、不进日志。渲染进程不长期持有。先判断 isEncryptionAvailable，解密失败就重新登录。Linux 没有密钥环时不能假装自己还是加密的。

## 常见追问

- **加密能防本机恶意程序吗？** 防不了已经能以该用户身份运行的程序。它防的是拷贝 userData 目录到另一台机器后直接读出 token。
- **要不要把 access token 也加密进 localStorage？** 不要。localStorage 在 XSS 下可读。短期令牌放内存，刷新令牌只留在主进程。

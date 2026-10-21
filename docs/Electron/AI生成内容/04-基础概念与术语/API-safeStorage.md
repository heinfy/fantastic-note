# safeStorage

`safeStorage` 用操作系统提供的加密能力，把字符串加密后再存到磁盘。主进程使用。

文档：[https://www.electronjs.org/docs/latest/api/safe-storage](https://www.electronjs.org/docs/latest/api/safe-storage)

当前平台的实现是：

- macOS：钥匙串
- Windows：DPAPI，和当前 Windows 用户绑定
- Linux：取决于桌面环境，可能是 gnome-libsecret 或 kwallet

## 用法

```js
const { safeStorage } = require('electron');

if (safeStorage.isEncryptionAvailable()) {
  const sealed = safeStorage.encryptString('refresh-token');
  const plain = safeStorage.decryptString(sealed);
}
```

官方建议优先使用异步的 `encryptStringAsync` 和 `decryptStringAsync`。它们不阻塞主进程，并能表示密钥暂时不可用、以及是否需要用新密钥重新加密。同步 API 在以后的版本里可能被弃用。

加密结果是 `Buffer`，可以编码成 base64 再写进 `userData` 里的文件。解密失败通常表示换了系统用户或钥匙串被重置，应用应回到重新登录。

Linux 上如果找不到密钥环，`setUsePlainTextEncryption(true)` 会改用一份进程内口令。这只在当前进程有效，不能当作跨重启的加密。调用前先看 `isEncryptionAvailable()`。

## 相关文档

- [术语-userData](./术语-userData.md)
- [概念-安全模型](./概念-安全模型.md)

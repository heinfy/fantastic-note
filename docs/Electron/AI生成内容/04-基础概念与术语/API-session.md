# session

`session` 管理一份网页的网络栈和存储。模块对象上的 `defaultSession` 是默认份。指定分区用 `session.fromPartition`。

文档：[https://www.electronjs.org/docs/latest/api/session](https://www.electronjs.org/docs/latest/api/session)

## 存储和缓存

```js
const ses = session.fromPartition('persist:account-a');
await ses.clearStorageData({
  storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'],
});
await ses.clearCache();
```

`cookies` 属性是 Cookie 对象，可以 `get`、`set`、`remove`、`flushStore`。

## 网络相关

| API | 作用 |
|-----|------|
| `ses.webRequest` | 在请求发出前、收到响应头时修改或取消请求 |
| `ses.setProxy` | 为这一份 session 设置代理或 PAC |
| `ses.setPermissionRequestHandler` | 回答网页的通知、定位、媒体等权限请求 |
| `ses.setDisplayMediaRequestHandler` | 回答 `getDisplayMedia`，把选定的屏幕源交给页面 |
| `ses.protocol.handle` | 在这一份 session 上注册自定义协议 |
| `ses.on('will-download')` | 页面触发下载时改保存路径、读进度 |

`webRequest` 的回调要尽快调用 `callback`，所有匹配的请求都在等它。同一类钩子后注册的监听会替换先前的监听，多个业务要自己串成一个函数。

代理和协议都是 session 级别。多账号窗口要分别设置。

## 相关文档

- [概念-会话与分区](./概念-会话与分区.md)
- [API-net](./API-net.md)
- [API-protocol](./API-protocol.md)

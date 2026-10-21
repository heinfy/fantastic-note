# protocol

`protocol` 注册自定义 scheme，让 `myapp://` 这样的地址有响应。不指定 session 时，作用在默认 session 上。

文档：[https://www.electronjs.org/docs/latest/api/protocol](https://www.electronjs.org/docs/latest/api/protocol)

## 特权 scheme

要让自定义协议支持标准 URL 解析、`fetch` 和安全上下文，在 `ready` 之前注册：

```js
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'myapp',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);
```

## handle

`ready` 之后处理请求。旧的 `registerFileProtocol`、`registerBufferProtocol`、`registerHttpProtocol`、`interceptFileProtocol` 等已经废弃。

```js
protocol.handle('myapp', (request) => {
  const { pathname } = new URL(request.url);
  const filePath = path.join(root, decodeURIComponent(pathname));
  return net.fetch(pathToFileURL(filePath).toString());
});
```

返回值是 Web 标准的 `Response`。`stream: true` 时，音视频可以按范围读取。

窗口使用了 `partition` 时，要在对应的 `session.protocol` 上注册，只注册 `electron.protocol` 不会作用到那份分区。

## 相关文档

- [概念-自定义协议与深度链接](./概念-自定义协议与深度链接.md)
- [API-net](./API-net.md)

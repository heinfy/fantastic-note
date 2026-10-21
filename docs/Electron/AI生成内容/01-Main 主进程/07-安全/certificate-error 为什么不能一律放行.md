# certificate-error 为什么不能一律放行？自签证书怎么处理？

## 考察点

- 中间人攻击在桌面端同样成立
- 企业内网证书的收口方式

## 参考答案

### 1. 错误写法

```js
app.on('certificate-error', (event, _url, _error, _cert, callback) => {
  event.preventDefault();
  callback(true); // 所有证书错误都当成功
});
```

这样等于关掉 HTTPS 校验。同一局域网里任何人都可能伪造更新服务器或 API，应用会把令牌交出去。开发抓包时临时打开，也不能进生产包。

### 2. 默认行为

不监听这个事件时，证书无效的请求直接失败。这是对的。用户访问坏证书站点，应该看到失败，而不是静默继续。

### 3. 企业内网自签或私有 CA

按优先级：

1. 把企业根证书装进系统信任区，让 Chromium 正常信任，应用里不写特例
2. 做不到系统信任时，只对**固定主机名**放行，并且核对证书指纹

```js
const PINNED = new Map([
  ['files.corp.example', 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='],
]);

app.on('certificate-error', (event, _wc, url, _error, certificate, callback) => {
  const host = new URL(url).hostname;
  const expected = PINNED.get(host);
  if (expected && certificate.fingerprint === expected) {
    event.preventDefault();
    callback(true);
    return;
  }
  callback(false);
});
```

指纹变更要走发布，不要在运行时从网络拉一份“新的可信指纹”。

### 4. 更新和接口分开看

自动更新的地址如果证书失败，应停止更新并打日志，绝不能为了“先更新上”跳过校验。否则攻击者可以直接发一份带签名绕过的包（若校验被跳过）。

Node `fetch` 的证书策略和 Chromium 不是一条。主进程如果混用两套客户端，企业证书可能只配了一边。

## 面试话术

> 生产环境不把 certificate-error 一律 callback(true)。能装进系统信任区的企业根证书就装系统，应用零特例。必须特例时只放行固定主机，并比对证书指纹。更新通道证书失败就停止更新。开发抓包的开关不能打进正式包。

## 常见追问

- **fingerprint 用哪一个字段？** 用 Electron 证书对象里文档标明的指纹字段，和运维给出的指纹用同一种算法比对，比对前统一大小写。
- **用户机器时间不对会导致证书失败吗？** 会。这种失败不应该放行，提示用户校准时间即可。

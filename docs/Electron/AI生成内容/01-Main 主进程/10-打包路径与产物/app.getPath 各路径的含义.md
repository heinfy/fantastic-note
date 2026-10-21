# app.getPath 里 userData、exe、logs、temp 分别是什么？怎么改 userData？

## 考察点

- 常用路径的含义和平台差异
- 多开、测试环境为什么要改 userData

## 参考答案

### 1. 常用路径

```js
app.getPath('userData');  // 配置、缓存、Partitions，按应用名隔离
app.getPath('logs');      // 默认在 userData/logs
app.getPath('temp');      // 系统临时目录
app.getPath('exe');       // 可执行文件自身
app.getPath('desktop');
app.getPath('downloads');
app.getPath('crashDumps');
```

`userData` 的默认位置：

- macOS：`~/Library/Application Support/<name>`
- Windows：`%APPDATA%\<name>`
- Linux：`~/.config/<name>`

这里放 electron-store、本地数据库、`Partitions`（session）、日志。卸载时如果不在安装脚本里删，这些会留下。

`exe` 在开发时指向 Electron 二进制，不是你的项目目录。不要用 `exe` 的相邻目录存用户数据，更新覆盖安装目录时会丢。

### 2. 改 userData 的时机

必须在 `ready` 之前：

```js
const { app } = require('electron');

// 测试包和正式包分开，避免抢同一份数据和单实例锁
if (process.env.APP_CHANNEL === 'beta') {
  app.setPath('userData', path.join(app.getPath('appData'), 'MyAgent-beta'));
}

app.whenReady().then(createWindow);
```

`requestSingleInstanceLock` 的范围就是同一份 userData。两个渠道要同时开，必须拆 userData，否则后启动的那个会直接退出。

### 3. 不要写安装目录

安装目录在 Program Files 或 `/Applications` 里，普通权限不可写，更新时还会被覆盖。所有可写数据只进 `userData` 或用户选的文档目录。

### 4. 路径给渲染进程时

不要把 `userData` 整段暴露给页面再让页面拼路径。页面只传业务 id，主进程在 `userData` 下面拼绝对路径，并检查结果仍在这个目录里。

## 面试话术

> userData 是配置和 session 的根，logs 默认在它下面，exe 是程序自己，temp 用完要删。用户数据不写 exe 旁边。多开或 beta 包在 ready 之前 setPath('userData')，否则会和正式版抢单实例锁和数据库。

## 常见追问

- **改了 userData，自动更新配置还在吗？** 不在，那是另一份目录。渠道隔离是故意的。
- **name 从哪来？** 默认来自 `app.setName` 或 package.json 的 name。产品名和包名不一致时，尽早 setName，避免升级后目录变了、用户配置“丢了”。

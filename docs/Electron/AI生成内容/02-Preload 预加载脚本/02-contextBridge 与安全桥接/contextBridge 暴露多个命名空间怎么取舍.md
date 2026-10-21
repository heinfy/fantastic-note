# contextBridge 暴露多个命名空间和暴露一个大对象怎么取舍？

## 考察点

- `exposeInMainWorld` 可以调用多次
- 和“每个窗口一份最小 API”怎么配合

## 参考答案

### 1. 两种写法

```js
// 一个对象，按域分组
contextBridge.exposeInMainWorld('api', {
  window: { minimize() {} },
  task: { start() {} },
});

// 多个全局名
contextBridge.exposeInMainWorld('baseApi', { minimize() {} });
contextBridge.exposeInMainWorld('taskApi', { start() {} });
```

技术上都能用。`exposeInMainWorld` 同一个 key 不能暴露两次，后一次会抛错。不同 key 可以并存。

### 2. 怎么选

一个窗口里的 API，用 **一个 `window.api`，里面按域分组** 即可。类型声明简单，页面也知道去哪找。

多个窗口的 preload **不要共用一个越来越大的对象**。设置窗口的 preload 只暴露设置需要的函数；日志窗口只暴露订阅日志。那是“不同文件暴露不同对象”，不是在同一个 preload 里挂五个全局变量。

多个全局名的合理场景：同一窗口里有一块第三方脚本，你希望它只能看见 `window.embedApi`，业务代码才用 `window.api`。注意主世界里的脚本都能读到已暴露的 key，这不是安全隔离，只是少让对方的代码碰到别的函数名。真隔离要用另一个 webContents。

### 3. 不要按 IPC 频道自动生成一个万能对象

```js
// 不推荐：页面可以猜频道名
contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});
```

分组是为了页面好用，不是为了少写校验。每个函数背后仍是固定频道。

## 面试话术

> 同一个窗口我只暴露一个 window.api，按业务域分组。不同窗口用不同 preload，各暴露各的最小集合。同一 key 不能 expose 两次。多个全局变量解决不了恶意脚本的问题，因为它们都在主世界里。

## 常见追问

- **域太多文件太大？** 源码按域拆模块，打包进同一个 preload。运行时仍是一个对象。
- **页面怎么知道这个窗口有没有某个 API？** 类型按窗口区分。运行时用可选调用只适合真的多窗口共用一份页面，并且缺能力时要有明确提示。

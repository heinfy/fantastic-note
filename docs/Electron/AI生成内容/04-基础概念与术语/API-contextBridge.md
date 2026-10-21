# contextBridge

`contextBridge` 在隔离的上下文之间建立一条受控的桥。官方描述是：安全地、双向地、同步地跨隔离上下文传递 API。

文档：[https://www.electronjs.org/docs/latest/api/context-bridge](https://www.electronjs.org/docs/latest/api/context-bridge)

## exposeInMainWorld

主世界（Main World）是页面脚本所在的上下文。预加载脚本在隔离世界。`exposeInMainWorld(key, api)` 把 `api` 放到页面的 `window[key]` 上。

```js
contextBridge.exposeInMainWorld('api', {
  doThing: () => ipcRenderer.send('do-a-thing'),
});
```

传递规则：

- 函数被代理。页面调用时，实际在预加载脚本一侧执行。
- 其他值被复制并冻结。任一侧事后修改对象，另一侧看不到。
- 支持的类型包括基础类型、普通对象、数组、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`、`Promise`、`Error`。DOM 节点和 Electron 的绑定对象不能直接送过桥。

把整个 `ipcRenderer` 送过桥，对面会得到空对象；即便包一层原样转发，页面也能发任意频道。为一个操作写一个函数。

## exposeInIsolatedWorld

`exposeInIsolatedWorld(worldId, apiKey, api)` 把 API 暴露给指定世界。`0` 是页面主世界，`999` 是 Electron 上下文隔离使用的世界。自定义隔离世界使用 `1000` 以上的 id。

同一个 key 不能暴露两次。

## 类型

TypeScript 不会自动知道 `window.api`。在渲染进程里用 `declare global` 扩展 `Window` 接口。

## 相关文档

- [概念-上下文隔离](./概念-上下文隔离.md)
- [术语-隔离世界与主世界](./术语-隔离世界与主世界.md)
- [术语-结构化克隆](./术语-结构化克隆.md)

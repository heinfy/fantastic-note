---
sidebar_position: 15
---

# effectScope、getCurrentScope 与 onScopeDispose

副作用作用域用于集中管理响应式副作用，并在结束时运行资源清理函数。

## 创建与停止作用域

```js
import { effectScope, onScopeDispose, ref, watchEffect } from 'vue';

const count = ref(0);
const scope = effectScope();

scope.run(() => {
  watchEffect(() => console.log(count.value));
  const timer = setInterval(() => count.value++, 1000);
  onScopeDispose(() => clearInterval(timer));
});

scope.stop(); // 停止侦听器，并清理计时器。
```

- `scope.run(fn)`：在该作用域中同步执行函数，收集其中创建的响应式副作用。
- `scope.stop()`：停止作用域中的副作用与子作用域，执行已注册的清理函数。
- `effectScope()`：若创建时有父作用域，停止父作用域也会停止它。
- `effectScope(true)`：创建脱离父作用域的作用域，调用方必须负责停止。

## 获取当前作用域与注册清理

```js
import { getCurrentScope, onScopeDispose } from 'vue';

function registerCleanup(cleanup) {
  if (getCurrentScope()) onScopeDispose(cleanup);
}
```

`getCurrentScope()` 返回当前活跃作用域，无作用域时为 `undefined`。注册清理使用 `onScopeDispose()`，不存在 `scope.onDispose()` 这一公共方法。

组件 `setup()` 本身处于作用域内，其中同步调用的组合函数通常无需再建作用域；计时器、事件监听、WebSocket 等资源需要显式注册清理。

## 示例：可手动停止的连接

```js
import { effectScope, onScopeDispose } from 'vue';

export function useWebSocket(url) {
  const scope = effectScope();
  let socket;

  scope.run(() => {
    socket = new WebSocket(url);
    onScopeDispose(() => socket.close());
  });

  return {
    send(data) { socket.send(data); },
    dispose() { scope.stop(); }
  };
}
```

发送前应确认连接处于 `WebSocket.OPEN`。在组件 `setup()` 中同步调用时，连接会随父作用域清理；在组件外使用时需要手动 `dispose()`。

## 与侦听器清理的区别

`onScopeDispose()` 在整个作用域停止时执行，适合组件或功能的资源清理；[onWatcherCleanup](007-watch.md) 在某个侦听器失效或停止时执行，适合取消上一轮请求。不要在每轮侦听回调中重复注册作用域清理。

参考：[响应式进阶 API](https://cn.vuejs.org/api/reactivity-advanced.html)。

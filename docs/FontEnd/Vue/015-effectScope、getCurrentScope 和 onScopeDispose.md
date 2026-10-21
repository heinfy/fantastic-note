`effectScope`、`getCurrentScope` 和 `onScopeDispose` 是 Vue 3.4+ 引入的 **响应式副作用作用域（Effect Scope）管理 API**，用于**组织、隔离和自动清理多个响应式副作用（如 `watch`、`watchEffect`、`computed` 等）**。

它们解决了 Composition API 中一个长期痛点：

> **“如何批量管理一组相关的副作用，并在适当时机（如组件卸载）自动清理它们？”**

---

## 一、核心概念：什么是 Effect Scope？

在 Vue 中，以下操作都会创建“副作用”（effect）：

- `watchEffect`
- `watch`
- `computed`
- `onInvalidate` / `onWatcherCleanup`

默认情况下，这些副作用会**绑定到当前活跃的组件实例**，并在组件卸载时自动清理。

但如果你在**组合函数（composable）** 或**非组件环境**（如 Pinia store、工具函数）中使用它们，就需要手动管理生命周期。

👉 **`effectScope` 就是为此设计的：它提供了一个可编程的作用域容器，用于收集和管理副作用。**

---

## 二、三个 API 详解

### 1. `effectScope(detached = false)`

#### ✅ 作用

- 创建一个新的**副作用作用域**
- 所有在此作用域内创建的响应式副作用（`watchEffect` 等）都会被自动收集到该作用域中

#### 🔧 参数

- `detached: boolean`（默认 `false`）
  - `false`：作用域会**继承父作用域**（通常是组件），组件卸载时自动清理
  - `true`：**脱离父作用域**，需手动调用 `.stop()` 清理

#### 📦 返回值

- 一个 scope 对象，包含：
  - `.run(fn)`：在作用域内执行函数
  - `.stop()`：手动停止并清理所有副作用
  - `.active`：是否仍处于激活状态

#### 💡 示例

```js
import { effectScope, watchEffect, ref } from 'vue';

const count = ref(0);

// 创建一个作用域
const scope = effectScope();

// 在作用域内运行副作用
scope.run(() => {
  watchEffect(() => {
    console.log('Count:', count.value);
  });
});

// 手动停止（清理所有副作用）
scope.stop(); // → 不再打印日志
```

---

### 2. `getCurrentScope()`

#### ✅ 作用

- 获取**当前活跃的 effect scope**
- 如果不在任何 scope 中（或不在组件 setup 中），返回 `undefined`

#### 🌟 典型用途

- 在组合函数中检查是否处于有效作用域
- 安全地注册清理逻辑

#### 💡 示例

```js
function useCustomFeature() {
  const scope = getCurrentScope();

  if (scope) {
    // 安全地注册清理
    scope.onDispose(() => {
      console.log('Cleaning up...');
    });
  }
}
```

---

### 3. `onScopeDispose(fn)`

#### ✅ 作用

- 注册一个**清理函数**，当**当前作用域停止时**自动调用
- 类似于组件的 `onUnmounted`，但适用于任意 effect scope

#### 🌟 与 `onWatcherCleanup` 的区别

| 函数               | 触发时机                         | 适用范围                          |
| ------------------ | -------------------------------- | --------------------------------- |
| `onWatcherCleanup` | 单个 watcher 停止前 / 下次执行前 | 仅在 `watch`/`watchEffect` 回调内 |
| `onScopeDispose`   | 整个 scope 停止时                | 任何处于 scope 内的代码           |

#### 💡 示例

```js
import { effectScope, onScopeDispose, watchEffect } from 'vue';

const scope = effectScope();

scope.run(() => {
  // 注册全局清理
  onScopeDispose(() => {
    console.log('All effects cleaned up!');
  });

  watchEffect(() => {
    // ...

    // 也可以在这里注册（等效）
    onScopeDispose(() => {
      console.log('This also runs on scope stop');
    });
  });
});

scope.stop();
// 输出:
// "This also runs on scope stop"
// "All effects cleaned up!"
```

> ✅ 所有通过 `onScopeDispose` 注册的函数都会在 `scope.stop()` 时按**注册顺序的逆序**执行。

---

## 三、典型使用场景

### 场景 1：编写健壮的组合函数（Composables）

```js
import { effectScope, onScopeDispose, watch } from 'vue';

export function useWebSocket(url) {
  const scope = effectScope(); // 创建独立作用域

  let ws = new WebSocket(url);

  scope.run(() => {
    // 监听状态
    watch(someRef, () => {
      /* ... */
    });

    // 注册清理
    onScopeDispose(() => {
      ws.close();
      console.log('WebSocket closed');
    });
  });

  // 返回控制方法
  return {
    send: data => ws.send(data),
    // 提供手动停止方法（可选）
    dispose: () => scope.stop()
  };
}

// 使用
const { send, dispose } = useWebSocket('wss://...');
// 组件卸载时自动清理（如果 scope 非 detached）
```

> ✅ 优势：
>
> - 即使组件未卸载，也可手动 `dispose()`
> - 自动清理所有内部副作用

---

### 场景 2：在非组件环境中管理副作用（如 Pinia Store）

```js
// stores/chat.js
import { defineStore } from 'pinia';
import { effectScope, onScopeDispose } from 'vue';

export const useChatStore = defineStore('chat', () => {
  const messages = ref([]);

  // 创建脱离的作用域（因为 store 不属于组件）
  const scope = effectScope(true); // detached = true

  scope.run(() => {
    // 监听路由变化等
    watch(route, () => {
      /* ... */
    });

    onScopeDispose(() => {
      // 清理连接、定时器等
    });
  });

  // 提供 store 卸载方法
  function $reset() {
    scope.stop();
    // ...其他重置逻辑
  }

  return { messages, $reset };
});
```

---

### 场景 3：临时副作用分组

```js
// 动态添加一组监听器
const tempScope = effectScope();

tempScope.run(() => {
  watch(a, () => {
    /* ... */
  });
  watch(b, () => {
    /* ... */
  });
  watchEffect(() => {
    /* ... */
  });
});

// 5秒后自动清理
setTimeout(() => {
  tempScope.stop(); // 所有监听器被移除
}, 5000);
```

---

## 四、与组件生命周期的关系

- 在 **`setup()`** 中，默认存在一个**组件级的作用域**
- 所有在 `setup` 中创建的 `watch`/`computed` 都属于该作用域
- 组件卸载时，**自动调用该作用域的 `.stop()`**
- 因此，你通常**不需要手动管理**组件内的副作用

> ✅ `effectScope` 主要用于：
>
> - 组合函数需要独立生命周期
> - 非组件环境（store、工具类）
> - 需要手动控制副作用生命周期的场景

---

## 五、总结

| API                 | 作用                     | 类比                       |
| ------------------- | ------------------------ | -------------------------- |
| `effectScope()`     | 创建副作用容器           | “副作用的盒子”             |
| `getCurrentScope()` | 获取当前盒子             | “我现在在哪个盒子？”       |
| `onScopeDispose()`  | 注册盒子销毁时的清理函数 | “盒子扔掉前，请先做这件事” |

> 💡 **记住**：
>
> - **默认情况下，Vue 已为你管理好组件内的副作用**
> - **当你需要“自定义生命周期”时，才需要 `effectScope`**

这些 API 让 Vue 的响应式系统更加灵活和可控，是构建高级可复用逻辑的关键工具。

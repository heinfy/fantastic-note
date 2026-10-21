在 Vue 3 的 Composition API 中，`watchEffect`、`watch` 及其变体（`watchPostEffect`、`watchSyncEffect`）以及 `onWatcherCleanup` 都是用于**响应式副作用（side effects）管理**的工具函数。它们都基于 Vue 的响应式系统，但**触发时机、依赖追踪方式、使用场景**有显著区别。

---

## 1. `watchEffect(fn)`

- **自动追踪依赖**：运行 `fn` 时访问的所有响应式数据都会被自动收集为依赖
- **立即执行一次**
- **异步调度**：在组件更新**之后**（DOM 已更新）执行回调（等同于 `flush: 'post'`）

语法：

```js
const stop = watchEffect(onCleanup => {
  // 副作用逻辑
  const data = someRef.value;
  fetchData(data);

  // 可选：注册清理函数
  onCleanup(() => {
    // 取消请求、清除定时器等
  });
});
```

---

## 2. `watch(source, callback, options?)`

- **显式声明依赖源（source）**
- **不会立即执行**（除非设置 `immediate: true`）
- 默认**异步调度**（`flush: 'pre'`，在组件更新前执行）

语法：

```js
// 监听单个 ref
watch(count, (newVal, oldVal) => { ... });

// 监听多个源
watch([count, name], ([newCount, newName], [oldCount, oldName]) => { ... });

// 监听 getter
watch(
  () => ({ id: userId.value, lang: locale.value }),
  (newVal, oldVal) => { ... }
);
```

- 需要访问**旧值和新值**
- 需要**精确控制依赖**（避免意外追踪）
- 需要**延迟首次执行**

---

## 3. `watchPostEffect(fn)` —— Vue 3.2+

本质：

```js
watchEffect(fn, { flush: 'post' });
```

- 在**DOM 更新后**执行（等同于 `nextTick` 时机）
- 适合操作 DOM 或依赖最终布局的场景

示例：

```js
watchPostEffect(() => {
  // 此时 DOM 已更新
  console.log(inputEl.value.offsetWidth);
});
```

---

## 4. `watchSyncEffect(fn)` —— Vue 3.2+

本质：

```js
watchEffect(fn, { flush: 'sync' });
```

- **同步执行**：在响应式数据变更后**立即执行**（不等待队列）
- **慎用！** 可能导致性能问题或无限循环

示例：

```js
watchSyncEffect(() => {
  // 立即同步执行
  syncState.value = source.value;
});
```

> 仅在需要严格同步的场景使用（如集成第三方库）

---

## 5. `onWatcherCleanup(fn)`

- 在**当前 watcher 停止前**或**下一次 effect 执行前**调用清理函数
- 是 `watchEffect` 和 `watch` 回调中 `onCleanup` 参数的**独立版本**

使用方式1：在 `watchEffect` / `watch` 回调中使用（推荐）

```js
watchEffect(onCleanup => {
  const timer = setTimeout(() => {
    /* ... */
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer); // 清理上一次的副作用
  });
});
```

使用方式2：独立调用（较少用）

```js
import { onWatcherCleanup } from 'vue';

watchEffect(() => {
  const timer = setTimeout(() => {
    /* ... */
  }, 1000);

  onWatcherCleanup(() => {
    clearTimeout(timer);
  });
});
```

> 💡 清理函数会在以下时机调用：
>
> - watcher 停止（组件卸载、手动调用 `stop()`）
> - 下一次 effect 重新运行前（避免重复副作用）

---

## 完整示例对比

```js
import { ref, watchEffect, watch, watchPostEffect, watchSyncEffect } from 'vue';

const count = ref(0);
const name = ref('Alice');

// 1. watchEffect：自动追踪 count 和 name
watchEffect(onCleanup => {
  console.log('watchEffect:', count.value, name.value);
  // onCleanup(() => { ... });
});

// 2. watch：显式监听，可获取旧值
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log('watch:', { newCount, oldCount, newName, oldName });
});

// 3. watchPostEffect：DOM 更新后执行
watchPostEffect(() => {
  console.log('DOM 已更新');
});

// 4. watchSyncEffect：同步执行（慎用）
watchSyncEffect(() => {
  console.log('同步执行');
});

// 触发更新
count.value++; // 所有效果按调度顺序触发
```

## 总结

| 函数               | 依赖追踪 | 首次执行                     | 调度时机                | 获取新/旧值 | 典型用途         |
| ------------------ | -------- | ---------------------------- | ----------------------- | ----------- | ---------------- |
| `watchEffect`      | 自动     | ✅ 立即                      | `'post'`（DOM 后）      | ❌          | 通用副作用       |
| `watch`            | 显式     | ❌（可设 `immediate: true`） | `'pre'`（默认，更新前） | ✅          | 精确控制、需旧值 |
| `watchPostEffect`  | 自动     | ✅                           | `'post'`                | ❌          | 操作 DOM         |
| `watchSyncEffect`  | 自动     | ✅                           | `'sync'`（同步）        | ❌          | 严格同步场景     |
| `onWatcherCleanup` | —        | —                            | —                       | —           | 清理副作用       |

> 📌 调度时机说明：
>
> - `'pre'`：组件更新**前**（可访问旧 DOM）
> - `'post'`：组件更新**后**（DOM 已更新，等同 `nextTick`）
> - `'sync'`：**同步立即执行**（不进队列）

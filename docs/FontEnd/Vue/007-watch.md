---
sidebar_position: 7
---

# watch 与副作用清理

`watch` 显式指定侦听源，`watchEffect` 自动收集同步执行期间读取的响应式依赖。二者默认都在所属组件 DOM 更新前调度回调（`flush: 'pre'`）。

## watch 与 watchEffect

```js
import { ref, watch, watchEffect } from 'vue';

const count = ref(0);
const name = ref('Alice');

watch(count, (value, oldValue) => {
  console.log(value, oldValue);
}); // 默认不会立即执行。

watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log(newCount, newName, oldCount, oldName);
});

watchEffect(() => {
  console.log(count.value, name.value);
}); // 立即执行一次，自动追踪依赖。
```

监听对象属性时使用 getter：`watch(() => state.count, callback)`，不要传入 `state.count` 的当前数字。异步 `watchEffect` 只追踪第一次 `await` 之前读取的依赖。

## 调度与常用选项

- `flush: 'pre'`（默认）：在父组件更新后、所属组件 DOM 更新前执行，回调会被批量调度。
- `flush: 'post'`：所属组件 DOM 更新后执行，适合读取 DOM；`watchPostEffect()` 是此配置的 `watchEffect` 别名。
- `flush: 'sync'`：数据变化时同步执行，不做批处理；`watchSyncEffect()` 是对应别名，避免用于频繁变更的数据。
- `immediate: true`：创建 `watch` 时立即执行回调。
- `deep: true`：深度侦听；Vue 3.5+ 可用数字限制遍历深度。直接侦听 `reactive` 对象默认深度侦听，getter 返回对象则默认只关注替换。
- `once: true`（Vue 3.4+）：源首次变化后停止侦听。

深度修改对象时，若对象引用没有替换，回调中的新旧值可能是同一对象，不是历史快照。

## 清理过期副作用

侦听器重新执行前或停止时，应取消上一次请求、计时器等副作用。

```js
import { ref, watch } from 'vue';

const userId = ref(1);
const user = ref(null);

const stop = watch(userId, async (id, oldId, onCleanup) => {
  const controller = new AbortController();
  onCleanup(() => controller.abort());

  try {
    const response = await fetch(`/api/users/${id}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!controller.signal.aborted) user.value = result;
  } catch (error) {
    if (error.name !== 'AbortError') console.error(error);
  }
}, { immediate: true });

// 不再需要侦听时调用 stop()。
```

Vue 3.5+ 也可在回调中使用 `onWatcherCleanup(() => controller.abort())`，必须在同步执行期间注册，不能放在 `await` 之后。参数形式的 `onCleanup` 绑定于当前侦听器，没有这一同步调用限制。

在组件 `setup()` 中同步创建的侦听器通常会随组件卸载自动停止；异步创建或组件外创建的侦听器需自行管理。多个副作用的统一清理见 [effectScope](015-effectScope、getCurrentScope%20和%20onScopeDispose.md)。

参考：[侦听器](https://cn.vuejs.org/guide/essentials/watchers.html)。

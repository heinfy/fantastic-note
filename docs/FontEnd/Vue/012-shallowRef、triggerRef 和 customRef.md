---
sidebar_position: 12
---

# shallowRef、triggerRef 与 customRef

`shallowRef` 保留内部值原样，`triggerRef` 手动通知依赖，`customRef` 自定义依赖收集与更新时机。

## shallowRef 与 triggerRef

```js
import { shallowRef, triggerRef, watchEffect } from 'vue';

const state = shallowRef({ count: 0 });
watchEffect(() => console.log(state.value.count));

state.value.count = 1; // 内部普通对象的修改不会通知依赖。
triggerRef(state); // 手动通知，输出 1。
state.value = { count: 2 }; // 替换 .value 会自动通知。
```

适合大型不可变数据、组件对象或由第三方系统维护的实例。`shallowRef()` 不主动转换内部值；若传入值本来是 `reactive` 代理，其内部响应性仍然保留。

通常通过整体替换更新数据；确实需要原地修改内部值时，再配合 `triggerRef()`。

## customRef：防抖输入

工厂函数接收 `track` 与 `trigger`，返回 `get` / `set`。下面的组合函数在组件 `setup()` 中使用，延迟更新并在作用域结束时清理计时器。

```js
import { customRef, onScopeDispose } from 'vue';

export function useDebouncedRef(value, delay = 300) {
  let timer;
  onScopeDispose(() => clearTimeout(timer));

  return customRef((track, trigger) => ({
    get() {
      track();
      return value;
    },
    set(nextValue) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        value = nextValue;
        trigger();
      }, delay);
    }
  }));
}
```

```js
const query = useDebouncedRef('', 500);
query.value = 'vue'; // 500ms 后更新值并通知依赖。
```

也可用于节流、按条件提交或与外部状态系统集成。getter 应保持返回值稳定，避免每次读取都创建新对象，导致子组件无必要地更新。

普通状态优先用 [ref / reactive](004-ref%20和%20reactive.md)，有明确需求时再控制浅层代理或更新时机。

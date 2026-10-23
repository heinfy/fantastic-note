---
sidebar_position: 9
---

# isRef、unref 与 toValue

这些工具用于处理普通值、ref 与 getter。`toValue()` 需 Vue 3.3+。

## 行为区别

- `isRef(value)`：判断值是否是 ref；`computed()` 返回的值也属于 ref。
- `unref(value)`：ref 返回 `.value`，其他值原样返回，不执行函数。
- `toValue(value)`：函数按 getter 调用，其他值按 `unref()` 处理；只归一化最外层。

```js
import { computed, isRef, ref, toValue, unref } from 'vue';

const count = ref(2);
const getter = () => count.value * 2;

isRef(count); // true
isRef(computed(getter)); // true
unref(count); // 2
unref(getter); // getter 函数本身。
toValue(getter); // 4
toValue(5); // 5
```

`unref()` / `toValue()` 读取当前值；要持续响应输入变化，需在 `computed()` 或侦听器内部读取。

## 示例：支持动态间隔的计时器

以下组合函数在组件 `setup()` 中调用，每次调度读取最新间隔，支持普通值、ref 与 getter。

```js
import { onScopeDispose, toValue } from 'vue';

export function useIntervalFn(callback, interval, immediate = false) {
  let timer;
  let active = false;

  function stop() {
    active = false;
    clearTimeout(timer);
  }

  function tick() {
    if (!active) return;
    callback();
    if (active) timer = setTimeout(tick, toValue(interval));
  }

  function start() {
    stop();
    active = true;
    if (immediate) tick();
    else timer = setTimeout(tick, toValue(interval));
  }

  onScopeDispose(stop);
  start();
  return { start, stop };
}
```

```js
const interval = ref(1000);
const { stop } = useIntervalFn(() => console.log('tick'), () => interval.value);
```

修改间隔会影响下一次调度，已开始的等待不会立即重置。作用域清理见 [onScopeDispose](015-effectScope、getCurrentScope%20和%20onScopeDispose.md)。

---
sidebar_position: 10
---

# isProxy、isReactive 与 isReadonly

这些函数判断 Vue 创建的响应式对象或 ref 的性质，不能用来检测任意 JavaScript `Proxy`。

## 三种判断

- `isProxy(value)`：是否为 `reactive`、`readonly` 或浅层版本创建的 Vue 代理。
- `isReactive(value)`：是否为响应式代理，也能识别包裹响应式代理的只读视图。
- `isReadonly(value)`：是否为只读代理或没有 setter 的 computed ref。

```js
import {
  computed, isProxy, isReactive, isReadonly,
  reactive, readonly, ref, shallowReactive
} from 'vue';

const state = reactive({ count: 0 });
const view = readonly(state);
const plainView = readonly({ count: 0 });
const count = computed(() => state.count);

console.log(isProxy(state), isReactive(state), isReadonly(state)); // true true false
console.log(isProxy(view), isReactive(view), isReadonly(view)); // true true true
console.log(isProxy(plainView), isReactive(plainView)); // true false
console.log(isProxy(count), isReadonly(count)); // false true
console.log(isReactive(shallowReactive({}))); // true
console.log(isReactive(ref({}).value)); // true
console.log(isProxy(ref(1))); // false，ref 自身不是 Proxy。
```

## 常见误区

`isReactive` 与 `isReadonly` 不互斥；只读视图可以保留原响应式对象的行为。`isProxy(value)` 也不等价于 `isReactive(value) || isReadonly(value)`，因为只读 computed ref 不是 Proxy。

这些判断适合调试数据来源与验证接口约束。无需先判断代理来避免重复 `reactive()`：对已有响应式代理调用 `reactive()` 会返回同一代理。需要处理 ref 时使用 [isRef](009-isRef、unref%20和%20toValue.md)。

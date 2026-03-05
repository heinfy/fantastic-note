`isRef`、`unref` 和 `toValue` 是 Vue 3 提供的 **响应式工具函数**，用于在组合式函数（Composables）或逻辑处理中**安全地操作可能为 `ref` 或普通值的数据**。它们共同解决了一个核心问题：

> **“我拿到的数据，到底是原始值，还是 ref 包装过的？怎么统一处理？”**

---

## 一、`isRef(value)` —— 判断是否是 ref

作用：检查一个值是否是由 `ref()`、`computed()` 等创建的 **Ref 对象**。

语法：

```js
import { isRef } from 'vue';

const count = ref(0);
const num = 42;

console.log(isRef(count)); // true
console.log(isRef(num)); // false
console.log(isRef(computed(() => 1))); // true
```

典型用途：编写兼容 ref / 普通值的通用函数

```js
// 一个通用的加法函数，支持传入 ref 或普通数字
function add(a, b) {
  const valA = isRef(a) ? a.value : a;
  const valB = isRef(b) ? b.value : b;
  return valA + valB;
}

const x = ref(5);
const y = 3;
console.log(add(x, y)); // 8
```

> 💡 在组合函数中，你可能接收外部传入的参数，不确定它是 `ref` 还是普通值，用 `isRef` 可安全处理。

---

## 二、`unref(value)` —— 自动解包 ref

作用：

- 如果 `value` 是 **ref**，返回 `value.value`
- 如果 `value` 是 **普通值**，直接返回 `value`

相当于：

```js
const unref = val => (isRef(val) ? val.value : val);
```

语法：

```js
import { ref, unref } from 'vue';

const count = ref(10);
const num = 20;

console.log(unref(count)); // 10
console.log(unref(num)); // 20
```

典型用途：简化代码，避免重复判断

1. 场景：组合函数接收可选 ref 参数

```js
function useTimeout(fn, delay) {
  // delay 可能是 ref(1000) 或 1000
  const resolvedDelay = unref(delay);

  const timer = setTimeout(fn, resolvedDelay);

  onUnmounted(() => clearTimeout(timer));
}
```

使用时更灵活：

```js
const delay = ref(2000);
useTimeout(() => console.log('done'), delay); // 支持 ref
useTimeout(() => console.log('done'), 1000); // 也支持普通值
```

---

## 三、`toValue(value)` —— Vue 3.3+ 新增

作用：**更强大的 `unref`**：不仅能解包 `ref`，还能**执行 getter 函数**！

 > `toValue` 会递归解包？❌ 它只解最外层，不会深度解包。

相当于：

```js
typeof source === 'function' ? source() : unref(source);
```

语法：

```js
import { toValue, ref } from 'vue';

const count = ref(1);
const getter = () => count.value * 2;
const plain = 3;

console.log(toValue(count)); // 1
console.log(toValue(getter)); // 2 （执行函数！）
console.log(toValue(plain)); // 3
```

典型用途：

- 编写**高度灵活的组合函数**，支持传入：
  - 普通值（`100`）
  - Ref（`ref(100)`）
  - Getter 函数（`() => someComputed.value`）

## 四、三者对比总结

| 函数      | 行为                    | 支持类型                  | 适用场景                 |
| --------- | ----------------------- | ------------------------- | ------------------------ |
| `isRef`   | 判断是否为 ref          | `ref` / 非 ref            | 类型检查、条件逻辑       |
| `unref`   | 解包 ref，否则返回原值  | `ref` / 普通值            | 通用参数处理             |
| `toValue` | 解包 ref **或执行函数** | `ref` / 普通值 / **函数** | 高级组合函数（Vue 3.3+） |

---

## useIntervalFn

```js
import { toValue, onScopeDispose } from 'vue';

function useIntervalFn(cb, interval, immediate = false) {
  let timer = null;

  const start = () => {
    stop();
    const invoke = () => {
      cb();
      timer = setTimeout(invoke, toValue(interval)); // 支持 ref/函数/普通值
    };
    if (immediate) invoke();
    else timer = setTimeout(invoke, toValue(interval));
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
  };

  start();
  onScopeDispose(stop);
}
```

使用方式（三种都支持）：

```js
// 1. 普通值
useIntervalFn(fn, 1000);

// 2. Ref
const interval = ref(2000);
useIntervalFn(fn, interval);

// 3. Getter（动态计算）
useIntervalFn(fn, () => (user.isPremium ? 500 : 2000));
```

> ✅ 这极大提升了 API 的灵活性！

---

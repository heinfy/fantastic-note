`isProxy`、`isReactive` 和 `isReadonly` 是 Vue 3 提供的 **响应式对象类型检查工具函数**，用于在运行时判断一个对象是否由 Vue 的响应式系统创建，以及它的具体类型。

---

## 一、核心概念回顾

Vue 3 的响应式系统基于 **ES6 Proxy**，主要创建三类代理对象：

| 类型                          | 创建方式                  | 特点                 |
| ----------------------------- | ------------------------- | -------------------- |
| **Reactive Proxy**            | `reactive(obj)`           | 可读可写，深度响应式 |
| **Readonly Proxy**            | `readonly(obj)`           | 只读，修改会警告     |
| **Shallow Reactive/Readonly** | `shallowReactive(obj)` 等 | 仅根层级响应式       |

> 所有这些对象都是 **Proxy 实例**，但用途不同。

---

## 二、三个函数详解

### 1. `isReactive(value)`

判断一个对象是否是由 **`reactive()`、`ref()`（内部对象）、`shallowReactive()`** 创建的**可变响应式代理**。

```js
import { reactive, ref, isReactive } from 'vue';

const state = reactive({ a: 1 });
const shallow = shallowReactive({ b: 2 });
const readOnly = readonly({ c: 3 });
const plain = { d: 4 };

console.log(isReactive(state)); // true
console.log(isReactive(shallow)); // true
console.log(isReactive(readOnly)); // false ❌
console.log(isReactive(plain)); // false

// ref 包装的对象也是 reactive
const objRef = ref({ e: 5 });
console.log(isReactive(objRef.value)); // true ✅
```

> ✅ **关键点**：
>
> - `isReactive` 返回 `true` 表示该对象是**可写的响应式对象**
> - `readonly` 对象返回 `false`

---

### 2. `isReadonly(value)`

判断一个对象是否是由 **`readonly()` 或 `shallowReadonly()`** 创建的**只读代理**。

```js
import { readonly, shallowReadonly, isReadonly } from 'vue';

const readOnly = readonly({ a: 1 });
const shallowRO = shallowReadonly({ b: 2 });
const reactiveObj = reactive({ c: 3 });

console.log(isReadonly(readOnly)); // true
console.log(isReadonly(shallowRO)); // true
console.log(isReadonly(reactiveObj)); // false
```

> ✅ **关键点**：
>
> - 只读对象**不能被修改**（严格模式下会报错，非严格模式下静默失败 + 警告）
> - 常用于保护状态不被意外更改（如 store 的 state）

---

### 3. `isProxy(value)`

判断一个对象是否是 **Vue 创建的任何类型的 Proxy**（包括 `reactive`、`readonly`、`shallowXXX` 等）。

```js
import { reactive, readonly, shallowReactive, isProxy } from 'vue';

const r = reactive({ a: 1 });
const ro = readonly({ b: 2 });
const sr = shallowReactive({ c: 3 });
const plain = { d: 4 };

console.log(isProxy(r)); // true
console.log(isProxy(ro)); // true
console.log(isProxy(sr)); // true
console.log(isProxy(plain)); // false
```

> ✅ **关键点**：
>
> - `isProxy` 是最宽泛的检查
> - 它等价于：`isReactive(value) || isReadonly(value)`

---

## 三、关系图解

```text
                ┌─────────────┐
                │   isProxy   │ ← 最宽泛：只要是 Vue Proxy 就 true
                └──────┬──────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────┐           ┌──────────────────┐
│  isReactive   │           │   isReadonly     │ ← 互斥（一个对象不会同时为两者）
└───────────────┘           └──────────────────┘
（可写响应式）               （只读响应式）
```

> 💡 一个对象**不可能同时是 `isReactive` 和 `isReadonly`**

---

## 四、典型使用场景

### 场景 1：编写安全的通用函数

```js
function cloneDeep(obj) {
  if (isProxy(obj)) {
    // 如果是响应式对象，先转为普通对象再克隆
    return JSON.parse(JSON.stringify(obj));
  }
  // ...普通克隆逻辑
}
```

### 场景 2：调试或日志

```js
console.log('State type:', {
  isProxy: isProxy(state),
  isReactive: isReactive(state),
  isReadonly: isReadonly(state)
});
```

### 场景 3：避免重复代理

```js
function makeReactive(obj) {
  if (isProxy(obj)) {
    return obj; // 已是响应式，无需再包装
  }
  return reactive(obj);
}
```

---

## 五、、总结表

| 函数         | 检测目标         | 返回 true 的情况                     | 典型创建方式                        |
| ------------ | ---------------- | ------------------------------------ | ----------------------------------- |
| `isProxy`    | 是否为 Vue Proxy | `reactive`, `readonly`, `shallowXXX` | 所有 Proxy 响应式对象               |
| `isReactive` | 是否为可写响应式 | `reactive`, `shallowReactive`        | `reactive()`, `ref({})` 的 `.value` |
| `isReadonly` | 是否为只读响应式 | `readonly`, `shallowReadonly`        | `readonly()`                        |

---

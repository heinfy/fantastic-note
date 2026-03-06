`toRaw()` 和 `markRaw()` 是 Vue 3 提供的两个用于**绕过或禁用响应式系统**的底层工具函数。它们的作用相反，但都用于**精细化控制哪些数据需要/不需要被 Vue 转为响应式**。

---

## 一、核心概念对比

| 函数           | 作用                                       | 使用场景                                     |
| -------------- | ------------------------------------------ | -------------------------------------------- |
| `toRaw(proxy)` | **从响应式代理对象中获取原始对象**         | 访问原始数据、避免无限递归、与第三方库交互   |
| `markRaw(obj)` | **标记一个对象，使其永远不会被转为响应式** | 性能优化、存储非响应式引用（如组件、类实例） |

> ✅ 它们都是“逃逸舱”（escape hatches），让你在必要时脱离 Vue 的响应式系统。

---

## 二、`toRaw(proxy)`

### ✅ 作用

- 接收一个 **Vue 创建的响应式代理对象**（如 `reactive`、`readonly`、`ref.value` 等）
- 返回其**内部的原始普通对象**
- **返回的对象完全脱离响应式系统**：修改它不会触发更新，读取它也不会收集依赖

### 🔧 示例

```js
import { reactive, toRaw, watchEffect } from 'vue';

const state = reactive({ count: 0 });

// 获取原始对象
const plain = toRaw(state);

console.log(plain === state); // false（proxy ≠ 原始对象）
console.log(plain.count); // 0

// 修改原始对象 → ❌ 不会触发响应式更新！
plain.count = 10;
console.log(state.count); // 10（值变了，但 watchEffect 不会执行）

// 监听 state
watchEffect(() => {
  console.log('Count:', state.count);
});

state.count = 20; // ✅ 触发更新（通过 proxy 修改）
```

### 🌟 典型用途

1. **避免无限递归（在自定义 setter 中）**

```js
const obj = reactive({
  set value(val) {
    // 如果直接 this._val = val，会再次触发 setter（因为 this 是 proxy）
    // 使用 toRaw 绕过代理
    toRaw(this)._val = val;
  }
});
```

2. **与第三方库交互（如 Lodash、Immutable.js）**

```js
import _ from 'lodash';

const list = reactive([{ id: 1 }, { id: 2 }]);
const found = _.find(toRaw(list), { id: 1 }); // 避免 lodash 操作触发不必要的追踪
```

3. **临时操作大量数据（性能优化）**

```js
// 批量修改时不触发多次更新
const raw = toRaw(largeList);
for (let i = 0; i < raw.length; i++) {
  raw[i].processed = true;
}
// 最后手动触发一次更新（如果需要）
```

> ⚠️ 注意：**不要持有 `toRaw` 返回的引用长期使用**，因为它已脱离响应式系统。

---

## 三、`markRaw(obj)`

### ✅ 作用

- 标记一个对象，**永久禁止 Vue 将其转为响应式**
- 即使将它放入 `reactive`、`ref` 或组件 data 中，**它仍保持原始状态**

### 🔧 示例

```js
import { reactive, markRaw } from 'vue';

class MyClass {
  constructor() {
    this.value = 1;
  }
}

const instance = new MyClass();
const marked = markRaw(instance);

const state = reactive({
  normal: { a: 1 },
  rawInstance: marked
});

console.log(isReactive(state.normal)); // true
console.log(isReactive(state.rawInstance)); // false ✅

// 修改 marked 对象 → ❌ 不会触发响应式更新
marked.value = 2;
```

### 🌟 典型用途

1. **存储组件构造函数或动态组件**

```js
const state = reactive({
  currentComponent: markRaw(SomeComponent)
});
```

> ✅ 避免 Vue 尝试代理组件对象（无意义且浪费性能）

2. **存储第三方库实例（如 Chart.js、Mapbox）**

```js
const chart = markRaw(new Chart(ctx, config));
const state = reactive({ chart });
```

> ✅ 这些实例通常包含循环引用或复杂结构，代理会导致错误或性能问题

3. **存储具有自身状态管理的对象**

```js
// 如 Vuex store 实例、自定义状态机
const store = markRaw(createStore());
```

4. **避免嵌套响应式（当你明确不需要时）**

```js
const config = markRaw({
  apiEndpoint: '/api',
  timeout: 5000
});
// 即使放入 reactive 对象，config 也不会被代理
```

---

## 四、关键区别总结

| 特性         | `toRaw`                 | `markRaw`            |
| ------------ | ----------------------- | -------------------- |
| **输入**     | 响应式代理对象（Proxy） | 普通对象             |
| **输出**     | 原始普通对象            | 同一个对象（带标记） |
| **时机**     | 运行时“解包”            | 创建时“标记”         |
| **目的**     | 临时脱离响应式          | 永久禁止响应式       |
| **是否可逆** | 是（你拿到原始对象）    | 否（标记永久存在）   |

---

## 五、常见误区

误区1：`markRaw` 能让已响应式的对象变回普通对象？

```js
const obj = reactive({ a: 1 });
markRaw(obj); // ❌ 无效！obj 已是 proxy，markRaw 必须在创建前调用
```

> ✅ `markRaw` 必须在对象**被传入响应式系统之前**调用。

误区2：`toRaw` 返回的对象可以安全长期持有？

> 不推荐！因为：
>
> - 它和响应式对象**共享同一份数据**
> - 直接修改它会**破坏响应式一致性**（值变了但 UI 不更新）
> - 应仅用于**临时操作**

误区3：`markRaw` 能提升所有对象的性能？

> 只对**不需要响应式**的对象有用。  
> 如果你仍需要监听该对象的变化，就不要用 `markRaw`！

---

## 六、最佳实践建议

| 场景                           | 推荐做法                                 |
| ------------------------------ | ---------------------------------------- |
| 需要临时访问原始数据           | `toRaw(proxy)`                           |
| 存储组件、类实例、第三方库对象 | `markRaw(instance)`                      |
| 大批量数据处理                 | 先 `toRaw`，操作完再考虑是否需要触发更新 |
| 动态组件切换                   | `current: markRaw(Component)`            |

---

## ✅ 总结

- **`toRaw`**：

  > “给我这个响应式对象背后的**真实数据**，我要临时绕过 Vue 的监控。”

- **`markRaw`**：
  > “这个对象**永远不要被 Vue 代理**，它有自己的生命。”

它们是 Vue 响应式系统的“安全阀”，合理使用能解决性能问题、兼容性问题和逻辑陷阱，但**不要滥用**——只有在明确知道不需要响应式时才使用。

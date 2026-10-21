`shallowReactive` 和 `shallowReadonly` 是 Vue 3 提供的 **浅层响应式 API**，它们与 `reactive` / `readonly` 的核心区别在于：

> **只对对象的“第一层属性”做响应式处理，嵌套的对象/数组内部不再递归代理。**

---

## 一、为什么需要“浅层”响应式？

Vue 的 `reactive()` 默认是**深度响应式（deep reactive）**：

```js
const state = reactive({
  a: {
    b: {
      c: 1
    }
  }
});
```

- 访问 `state.a.b.c` 时，会递归地将 `a`、`a.b` 都转为 `reactive` 对象
- **优点**：所有层级都响应式
- **缺点**：对大型/深层对象，**性能开销大**（创建大量 Proxy）

而 `shallowReactive` / `shallowReadonly` **只代理根层级**，内部保持原样，适用于：

- 性能敏感场景（如大型配置、表格数据）
- 内部数据不需要响应式（或由其他系统管理）

---

## 二、`shallowReactive(obj)`

作用：

- 创建一个**可写的浅层响应式代理**
- **仅根属性**（如 `obj.a`）是响应式的
- **嵌套属性**（如 `obj.a.b`）**不是响应式的**

示例：

```js
import { shallowReactive, watchEffect } from 'vue';

const state = shallowReactive({
  foo: 1,
  nested: {
    bar: 2
  }
});

watchEffect(() => {
  console.log('foo:', state.foo);
  console.log('bar:', state.nested.bar);
});

// ✅ 触发更新：根属性变更
state.foo = 10; // → 打印新值

// ❌ 不触发更新：嵌套属性变更
state.nested.bar = 20; // → watchEffect 不重新执行！

// ✅ 触发更新：替换整个 nested 对象
state.nested = { bar: 30 }; // → 打印新值
```

适用场景：

- 表格数据（每行是一个对象，但你只关心行的增删，不关心单元格修改）
- 大型配置对象（如编辑器设置）
- 从第三方库接收的复杂对象（你只监听顶层变化）

---

## 三、`shallowReadonly(obj)`

作用：

- 创建一个**只读的浅层响应式代理**
- 根属性不可修改（修改会警告）
- 嵌套对象**既不响应式，也不只读**（可被外部修改！）

示例：

```js
import { shallowReadonly } from 'vue';

const config = shallowReadonly({
  theme: 'dark',
  options: {
    debug: true
  }
});

// ❌ 警告：Cannot mutate readonly property "theme"
config.theme = 'light';

// ✅ 允许！因为 nested 对象不是 readonly（只是普通对象）
config.options.debug = false; // 静默成功（无警告）

// ❌ 警告：Cannot mutate readonly property "options"
config.options = {}; // 替换根属性会警告
```

> ⚠️ 注意：`shallowReadonly` **不能保护嵌套对象不被修改**！  
> 如果需要深度只读，用 `readonly()`。

适用场景：

- 提供 API 配置对象（防止用户修改顶层结构）
- 性能优先的只读数据展示（如日志列表）

---

## 四、与深度响应式的对比

| 操作          | `reactive`       | `shallowReactive`  |
| ------------- | ---------------- | ------------------ |
| `obj.a = 1`   | ✅ 响应式        | ✅ 响应式          |
| `obj.a.b = 2` | ✅ 响应式        | ❌ 非响应式        |
| 内存/CPU 开销 | 高（递归 Proxy） | 低（仅一层 Proxy） |

| 操作          | `readonly`     | `shallowReadonly` |
| ------------- | -------------- | ----------------- |
| `obj.a = 1`   | ❌ 警告        | ❌ 警告           |
| `obj.a.b = 2` | ❌ 警告        | ✅ 允许（无保护） |
| 安全性        | 高（深度只读） | 低（仅顶层只读）  |

---

## 五、如何选择？

### ✅ 使用 `shallowReactive` / `shallowReadonly` 当：

- 对象**非常大或嵌套很深**
- 你**只关心根属性的变化**
- 嵌套数据由**其他机制管理**（如 Immutable.js、手动更新）

### ✅ 使用 `reactive` / `readonly` 当：

- 需要**完整的深度响应式/只读**
- 数据结构较简单
- 安全性要求高（如防止任何修改）

---

## 六、重要注意事项

### 1. **解构会丢失响应性（和 `reactive` 一样）**

```js
const { nested } = shallowReactive({ nested: { bar: 1 } });
nested.bar = 2; // ❌ 非响应式，且无法追踪
```

> 解决方案：不要解构，或使用 `toRefs`（但 `toRefs` 对 shallow 对象也只处理根属性）

### 2. **`isReactive` / `isReadonly` 仍返回 true**

```js
console.log(isReactive(shallowReactive({}))); // true
console.log(isReadonly(shallowReadonly({}))); // true
```

### 3. **模板中行为一致**

```vue
<template>
  {{ state.nested.bar }}
  <!-- 能显示，但嵌套变更不更新 -->
</template>
```

---

## 七、总结

| API               | 响应深度   | 可写性            | 用途               |
| ----------------- | ---------- | ----------------- | ------------------ |
| `reactive`        | 深度       | ✅ 可写           | 通用响应式对象     |
| `readonly`        | 深度       | ❌ 只读           | 安全的只读状态     |
| `shallowReactive` | **仅根层** | ✅ 可写           | **高性能场景**     |
| `shallowReadonly` | **仅根层** | ❌ 只读（仅顶层） | **轻量级只读配置** |

合理使用浅层响应式，可以在保证功能的同时显著提升应用性能！

> **✅ `readonly` 和 `shallowReadonly` 创建的对象本身是响应式的（reactive），但它们是“只读”的——你不能修改它们，但当原始数据变化时，它们会自动更新。**

---

## 一、核心原理：`readonly` 是“只读视图”，不是“静态快照”

`readonly(obj)` 并**不会复制数据**，而是创建一个 **只读的 Proxy 代理**，它仍然**追踪原始响应式对象的变化**。

### 🧪 实验验证

```js
import { reactive, readonly, watchEffect } from 'vue';

// 1. 原始响应式对象
const original = reactive({ count: 0 });

// 2. 创建只读视图
const readOnlyView = readonly(original);

// 3. 监听只读视图
watchEffect(() => {
  console.log('Read-only count:', readOnlyView.count);
});

// 4. 修改原始对象
original.count = 1; // ✅ 触发更新！
// 输出: "Read-only count: 1"
```

> ✅ 结论：**`readonly` 对象是响应式的**，它反映原始数据的变化。

---

## 二、`shallowReadonly` 同样是响应式的（但仅限根层）

```js
import { reactive, shallowReadonly, watchEffect } from 'vue';

const original = reactive({
  a: 1,
  nested: { b: 2 }
});

const shallowRO = shallowReadonly(original);

watchEffect(() => {
  console.log('a:', shallowRO.a);
  console.log('b:', shallowRO.nested.b);
});

// ✅ 触发更新：根属性变更
original.a = 10; // → 打印新值

// ✅ 也触发更新！因为 nested 对象本身是 reactive 的
original.nested.b = 20; // → 打印新值（因为 original.nested 是 reactive）

// ❌ 但如果 nested 不是 reactive，则不响应
const plainObj = { a: 1, nested: { b: 2 } };
const shallowRO2 = shallowReadonly(plainObj);
// 修改 plainObj.nested.b 不会触发更新（因为 plainObj 本身非响应式）
```

> ✅ 关键点：  
> - `shallowReadonly` 的响应性**取决于原始对象是否响应式**
> - 如果原始对象是 `reactive`，那么：
>   - 根属性变化 → 响应式更新
>   - 嵌套属性变化 → **如果嵌套对象也是 reactive，则仍会更新**（因为原始数据变了）

---

## 三、重要澄清：什么是“响应式”？

在 Vue 中，“响应式”指：
> **当数据源变化时，依赖该数据的副作用（如模板、watchEffect）会自动重新执行。**

`readonly` / `shallowReadonly` **完全满足这个定义**，所以它们是响应式的。

它们和 `reactive` 的唯一区别是：
- **`reactive`：可读 + 可写**
- **`readonly`：可读 + 不可写（写会警告）**

---

## 四、常见误区

### ❌ 误区1：“readonly 是静态的，不会更新”
> 错！它是**动态只读视图**，始终与原始数据同步。

### ❌ 误区2：“shallowReadonly 的嵌套属性一定不响应”
> 不一定！如果原始嵌套对象是 `reactive`，它仍然会响应。  
> `shallowReadonly` 只表示**它自己不会把嵌套对象转为 readonly**，但不阻止原始数据的响应性。

---

## 五、总结

| 问题 | 答案 |
|------|------|
| `readonly` 是响应式的吗？ | ✅ 是！它反映原始响应式数据的变化 |
| `shallowReadonly` 是响应式的吗？ | ✅ 是！只要原始对象是响应式的 |
| 它们能被修改吗？ | ❌ 不能（修改会警告，且无效） |
| 它们和 `reactive` 的区别？ | **只读 vs 可写**，响应性机制相同 |

> **`readonly` = “只读的窗口”，不是“照片”**  
> 它背后的数据流依然活跃，只是你不能从这个窗口往里写。

这种设计使得 `readonly` 成为**安全暴露内部状态**的理想工具（如 Vuex/Pinia 的 store state）。
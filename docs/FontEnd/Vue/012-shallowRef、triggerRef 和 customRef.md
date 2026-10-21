`shallowRef`、`triggerRef` 和 `customRef` 是 Vue 3 中用于**精细化控制响应式行为**的高级 Ref 工具。它们都基于 `ref` 的概念，但在**响应深度、更新触发机制、自定义能力**上有显著区别。

下面从原理到使用逐层解析：

---

## 一、核心对比速览

| 函数 | 响应深度 | 手动触发更新 | 自定义 getter/setter | 典型用途 |
|------|--------|------------|-------------------|--------|
| `shallowRef` | **仅 `.value` 本身**（对象内部不响应） | ✅ 需配合 `triggerRef` | ❌ 否 | 大型对象、DOM 引用、第三方库实例 |
| `triggerRef` | — | ✅ 强制触发 `shallowRef` 更新 | — | 手动通知 shallowRef 变更 |
| `customRef` | **完全自定义** | ✅ 在 setter 中控制 | ✅ 是 | 防抖、节流、延迟更新等高级逻辑 |

---

## 二、详细解析

### 1. `shallowRef(value)`

本质
- 创建一个 **浅层 ref**
- **只对 `.value` 的替换操作响应**，**不追踪 `.value` 内部属性的变化**

示例
```js
import { shallowRef, watchEffect } from 'vue';

const state = shallowRef({ count: 0 });

watchEffect(() => {
  console.log('Count:', state.value.count);
});

// ❌ 不会触发更新！因为修改的是内部属性
state.value.count = 1;

// ✅ 会触发更新：替换了整个 .value
state.value = { count: 1 };
```

适用场景
- 存储 **大型对象**（避免深度代理性能开销）
- 存储 **DOM 元素引用**
- 存储 **第三方库实例**（如 Chart.js 实例）
- 你**只关心整体替换**，不关心内部变化

> 💡 性能提示：对于包含 thousands of properties 的对象，`shallowRef` 比 `ref` 快得多。

---

### 2. `triggerRef(ref)`

作用
- **手动触发**一个 `shallowRef`（或普通 `ref`）的依赖更新
- 用于通知 Vue：“`.value` 内部已经变了，请重新渲染”

示例（配合 `shallowRef`）
```js
import { shallowRef, triggerRef, watchEffect } from 'vue';

const state = shallowRef({ count: 0 });

watchEffect(() => {
  console.log('Count:', state.value.count);
});

// 修改内部属性
state.value.count = 1;

// 手动触发更新
triggerRef(state); // ✅ 现在会打印 "Count: 1"
```

 注意
- 对普通 `ref` 也有效，但通常不需要（因为普通 `ref` 对象内部已是 `reactive`，自动响应）
- **主要为 `shallowRef` 设计**

---

### 3. `customRef(factory)`

本质
- **完全自定义 ref 的行为**
- 通过传入一个工厂函数，手动控制 `track`（依赖收集）和 `trigger`（触发更新）

语法
```js
customRef((track, trigger) => {
  return {
    get() {
      track(); // 收集依赖
      return value;
    },
    set(newValue) {
      value = newValue;
      trigger(); // 触发更新
    }
  };
});
```

经典示例：防抖 ref

```js
import { customRef } from 'vue';

function useDebouncedRef(value, delay = 300) {
  let timeout;
  return customRef((track, trigger) => {
    return {
      get() {
        track();
        return value;
      },
      set(newValue) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          value = newValue;
          trigger(); // 延迟后才触发更新
        }, delay);
      }
    };
  });
}

// 使用
const searchQuery = useDebouncedRef('', 500);
searchQuery.value = 'hello'; // 不会立即更新，500ms 后才触发
```

其他用途
- 节流（throttle）
- 延迟同步（如输入框回车才提交）
- 条件更新（只在满足某条件时触发）
- 与外部状态系统集成（如 RxJS）

---

## 三、关键区别详解

### ▶ 响应深度 vs 控制粒度

| 方式 | 响应深度 | 控制粒度 | 是否自动响应 |
|------|--------|--------|------------|
| `ref` | 深度（对象内部也响应） | 低 | ✅ 自动 |
| `shallowRef` | 仅 `.value` 替换 | 中（需手动 `triggerRef`） | ❌ 内部变更不自动 |
| `customRef` | 完全自定义 | 高（精确控制 track/trigger） | ⚠️ 按需触发 |

### ▶ 性能考量

- `shallowRef`：**内存和 CPU 开销最小**，适合大对象
- `customRef`：**灵活性最高**，但需自行管理性能（如防抖本身就是为了优化性能）

---

## 四、使用建议

### ✅ 优先使用 `shallowRef + triggerRef` 当：
- 你有一个**不可变的大对象**（如从 API 获取的复杂配置）
- 你通过**方法修改内部状态**，但希望手动控制更新时机
- 示例：Canvas 渲染引擎的状态对象

```js
const canvasState = shallowRef(new CanvasEngine());

// 修改内部
canvasState.value.resize(800, 600);
// 手动触发重绘
triggerRef(canvasState);
```

### ✅ 使用 `customRef` 当：
- 你需要**非即时的响应逻辑**
- 你要实现**高级副作用控制**（如防抖搜索）
- 你正在封装**与外部系统交互的响应式桥接**

---

## 五、、总结

| 工具 | 核心价值 | 一句话记住 |
|------|--------|----------|
| `shallowRef` | **性能优化**：避免深度代理大对象 | “我只关心整体替换” |
| `triggerRef` | **手动补位**：通知 shallowRef 内部已变 | “虽然我没换 `.value`，但我变了！” |
| `customRef` | **完全掌控**：自定义响应式逻辑 | “我想怎么响应，就怎么响应！” |

这三者共同构成了 Vue 3 响应式系统的“高级武器库”，让你在面对复杂场景时，既能**保性能**，又能**控逻辑**。掌握它们，你就真正理解了 Vue 响应式的灵活性与强大。
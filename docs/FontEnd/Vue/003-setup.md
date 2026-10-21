`setup()` 是 **Vue 3 Composition API 的核心入口函数**，用于替代 Vue 2 中的 `data`、`methods`、`computed`、`watch` 等选项，提供一种更灵活、逻辑可复用的组件编写方式。

---

## 一、`setup` 是什么？

`setup` 是一个**组件选项（option）**，在使用 Composition API 时定义在组件对象中：

```js
export default {
  setup(props, context) {
    // 在这里编写响应式逻辑、定义变量、方法等
    return {
      // 返回要在模板中使用的属性或方法
    };
  }
};
```

> `<script setup>` 是编译时语法糖，本质仍是 `setup()`，但更简洁。

---

## 二、`setup` 什么时候执行？

执行时机：**在组件实例创建之后，但在 `beforeCreate` 和 `created` 生命周期之前**

---

## 三、`setup` 接收哪些参数？

### 1. `props`（响应式，但不可解构）

- 包含父组件传入的所有 prop
- 是**响应式的**（当父组件更新 prop 时，`props` 会自动更新）
- **不能直接解构**（会丢失响应性），应使用 `toRefs` 或 `watch`：

```js
import { toRefs } from 'vue';

setup(props) {
  // ❌ 错误：失去响应性
  const { title } = props;

  // ✅ 正确：保持响应性
  const { title } = toRefs(props);
}
```

### 2. `context`（普通 JavaScript 对象，非响应式）

包含 4 个属性：

- `attrs`：非 prop 的 attribute（类似 `$attrs`）
- `slots`：插槽（类似 `$slots`）
- `emit`：触发事件的方法（类似 `$emit`）
- `expose`：触发事件的方法（类似 `$emit`）

```js
setup(props, { attrs, slots, emit }) {
  // 使用 emit 触发自定义事件
  const handleClick = () => {
    emit('update', 'new value');
  };
}
```

---

## 四、`setup` 使用案例

<details>
<summary>点击查看折叠的代码</summary>

```html
<!-- Parent.vue -->
<template>
  <div>
    <h2>父组件 => parentCount = {{ parentCount }}</h2>
    <ChildComponent
      :title="'Hello from Parent'"
      :count="parentCount"
      @update-count="handleUpdate"
      class="my-custom-class"
      data-test="example"
    >
      <!-- 默认插槽 -->
      <p>这是默认插槽内容</p>

      <!-- 具名插槽 -->
      <template #footer>
        <button @click="parentCount++">+1 (父组件按钮)</button>
      </template>
    </ChildComponent>
  </div>
</template>

<script>
  import { ref } from 'vue';
  import ChildComponent from './ChildComponent.vue';

  export default {
    components: { ChildComponent },
    setup() {
      const parentCount = ref(10);

      const handleUpdate = newVal => {
        parentCount.value = newVal;
      };

      return {
        parentCount,
        handleUpdate // ✅ 修正
      };
    }
  };
</script>
```

```html
<!-- ChildComponent.vue -->
<template>
  <div
    v-bind="attrs"
    class="child-wrapper"
  >
    <h3>{{ title }}</h3>
    <p>当前 count（来自 props）: {{ count }}</p>
    <p>计算值 doubleCount: {{ doubleCount }}</p>

    <!-- 使用默认插槽 -->
    <div class="slot-default">
      <slot />
    </div>

    <!-- 按钮触发 emit -->
    <button @click="increment">子组件 +1 并 emit</button>

    <!-- 使用具名插槽 -->
    <div class="slot-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
  import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';

  export default {
    name: 'ChildComponent',
    props: {
      title: String,
      count: Number
    },
    emits: ['update-count'], // 显式声明事件（推荐）

    setup(props, context) {
      // 👇 解构 context（安全，因为它是普通对象）
      const { attrs, slots, emit } = context;

      console.log('context', context);
      // 1. 使用 props（响应式）
      console.log('props:', props); // { title: '...', count: 10 }

      // 2. 使用 attrs（非 prop 的 attribute，如 class, data-* 等）
      console.log('attrs:', attrs); // { class: 'my-custom-class', 'data-test': 'example' }

      // 3. 使用 slots（插槽函数）
      console.log('slots:', Object.keys(slots)); // ['default', 'footer']

      // 4. 响应式数据
      const localState = reactive({
        internalCount: 0
      });

      const message = ref('Hello from setup');

      // 5. 计算属性
      const doubleCount = computed(() => props.count * 2);

      // 6. 方法：触发 emit
      const increment = () => {
        const newCount = props.count + 1;
        emit('update-count', newCount); // 触发自定义事件
      };

      // 7. 生命周期钩子
      onMounted(() => {
        console.log('ChildComponent 已挂载');
        console.log('当前实例:', getCurrentInstance());
      });

      // 8. 可选：在 setup 中使用 slots 渲染（通常模板中用 <slot> 更简单）
      // 例如：const defaultSlot = slots.default?.();

      // 返回给模板使用的属性和方法
      return {
        // 响应式数据
        message,
        localState,

        // 计算属性
        doubleCount,

        // 方法
        increment,

        // 来自 props（可选，模板中可直接用 props，但返回后更明确）
        title: props.title,
        count: props.count,

        // attrs 用于 v-bind（见模板）
        attrs
      };
    }
  };
</script>

<style scoped>
  .child-wrapper {
    border: 1px solid #ccc;
    padding: 16px;
    margin: 8px 0;
  }
  .slot-default {
    background-color: #f0f0f0;
    padding: 8px;
  }
  .slot-footer {
    margin-top: 12px;
  }
</style>
```

</details>

## 五、`setup` 的 `context.expose` 属性

`context.expose` 是 Vue 3.2+ 引入的一个 **`setup()` 函数上下文（context）中的新属性**，用于**显式控制组件实例对外暴露的公共属性（public instance）**。

它的核心作用是：**解决“组件内部逻辑”与“外部可访问 API”之间的隔离问题**。

---

### `expose` 是什么？

- `expose` 是 `setup(props, context)` 中 `context` 的第四个属性（除了 `attrs`、`slots`、`emit`）
- 类型：`function expose(obj?: Record<string, any>)`
- 调用后，**只有 `obj` 中的属性会出现在组件实例的公共代理上**

> ✅ 组件模板内部仍可访问所有返回值，但**外部（如父组件通过 ref）只能访问 expose 的内容**

---

### 示例：只暴露特定方法

```vue
<!-- Child.vue -->
<script>
import { ref } from 'vue';

export default {
  setup(props, { expose }) {
    const internalState = ref(0); // 内部状态，不暴露
    const publicCount = ref(100); // 想暴露的数据

    const privateMethod = () => {
      console.log('这是私有方法');
    };

    const focusInput = () => {
      // 聚焦输入框等操作
      console.log('聚焦！');
    };

    // 👇 关键：只暴露 focusInput 和 publicCount
    expose({
      focusInput,
      publicCount
    });

    // 注意：setup 仍然可以 return 给模板使用
    return {
      internalState,
      publicCount,
      privateMethod,
      focusInput
    };
  }
};
</script>

<template>
  <div>
    <!-- 模板中可以使用所有返回项 -->
    内部: {{ internalState }} | 公共: {{ publicCount }}
    <button @click="privateMethod">内部按钮</button>
  </div>
</template>
```

### 父组件访问

```vue
<!-- Parent.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import Child from './Child.vue';

const childRef = ref();

onMounted(() => {
  // ✅ 可以访问
  childRef.value.focusInput(); // 正常调用
  console.log(childRef.value.publicCount.value); // 100

  // ❌ undefined！未被 expose
  console.log(childRef.value.internalState); // undefined
  console.log(childRef.value.privateMethod); // undefined
});
</script>

<template>
  <Child ref="childRef" />
</template>
```

---

### 重要规则

| 场景                            | 行为                                                 |
| ------------------------------- | ---------------------------------------------------- |
| **调用了 `expose({})`**         | 组件实例**只包含 expose 的内容**，其他一律不可见     |
| **调用了 `expose()`（无参数）** | 组件实例**完全为空对象**（`{}`）                     |
| **未调用 `expose`**             | 默认行为：**返回对象中的所有属性都暴露**（兼容旧版） |
| **模板中使用**                  | 不受影响！模板始终能访问 `setup` 返回的所有内容      |

> 💡 `expose` **只影响外部通过 `ref` 或 `$parent` 访问的实例**，不影响组件自身模板或内部逻辑。

在 `<script setup>` 中，**默认不暴露任何内容**（即相当于自动调用了 `expose()`），要暴露内容，必须使用 `defineExpose` 宏。

> ✅ **最佳实践**：  
> 如果你的组件可能被 `ref` 引用，建议使用 `expose` 或 `defineExpose` **显式定义公共 API**，提升封装性和可维护性。

---

### 典型使用场景

1. **封装 UI 组件**
   - 暴露 `focus()`、`scrollTo()` 等方法
   - 隐藏内部状态和工具函数

2. **提供清晰的公共 API**
   - 明确告诉使用者“你可以调用什么”

3. **防止误用**
   - 避免父组件直接修改子组件内部数据

4. **与第三方库集成**
   - 暴露统一接口供外部控制

## 六、`define` 宏

在 Vue 3 的 `<script setup>` 语法中，为了在**没有显式 `setup()` 函数**的情况下也能使用 Composition API 的核心功能（如声明 props、emit、slots 等），Vue 提供了一组 **“编译时宏（Compile-time Macros）”**。

这些宏**只能在 `<script setup>` 中使用**，它们不是从 `'vue'` 导入的函数，而是在编译阶段被静态分析并转换为实际代码的特殊标识符。

---

## ✅ 所有官方支持的 `<script setup>` 宏（截至 Vue 3.4+）

| 宏 | 作用 | 是否必须导入 | 示例 |
|----|------|-------------|------|
| `defineProps` | 声明组件接收的 props | ❌ 不需要 | `const props = defineProps(['title'])` |
| `defineEmits` | 声明组件触发的事件 | ❌ 不需要 | `const emit = defineEmits(['update'])` |
| `defineExpose` | 控制通过 `ref` 暴露的公共属性 | ❌ 不需要 | `defineExpose({ focus })` |
| `defineSlots` | 类型辅助（仅用于 TypeScript） | ❌ 不需要 | `const slots = defineSlots()` |
| `defineModel` | （Vue 3.5+ 实验性）简化 v-model 双向绑定 | ❌ 不需要 | `const modelValue = defineModel()` |

> 🔔 注意：这些宏**不能被重命名**（如 `import { defineProps as dp } from 'vue'` 是无效的），因为它们依赖编译器静态识别。

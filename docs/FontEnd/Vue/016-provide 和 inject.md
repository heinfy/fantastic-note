---
sidebar_position: 16
---

# provide 与 inject

依赖注入用于祖先组件向后代组件提供上下文，避免逐层传递 props。普通父子交互优先使用 props 与 emits。

## 提供只读状态与修改方法

使用共享的 Symbol 作为 key 可避免命名冲突。

```js
// keys.js
export const countKey = Symbol('count');
```

```vue
<!-- Parent.vue -->
<script setup>
import { provide, readonly, ref } from 'vue';
import { countKey } from './keys';
import Child from './Child.vue';

const count = ref(0);
provide(countKey, {
  count: readonly(count),
  increment: () => count.value++
});
</script>

<template>
  <Child />
</template>
```

```vue
<!-- Child.vue，也可以在任意后代组件中注入 -->
<script setup>
import { inject } from 'vue';
import { countKey } from './keys';

const context = inject(countKey);
if (!context) throw new Error('缺少 count 上下文');
const { count, increment } = context;
</script>

<template>
  <button @click="increment">计数：{{ count }}</button>
</template>
```

`provide()` 不会自动将普通值变成响应式数据。提供 ref 时，注入方获得同一 ref，JavaScript 中仍通过 `.value` 访问；提供响应式对象时保留该代理。

## 查找规则与默认值

- 同一 key 从最近的祖先提供者查找；`app.provide()` 提供应用级依赖。
- 未找到时，`inject(key, defaultValue)` 返回默认值。
- 默认值需要工厂函数时，使用 `inject(key, () => createValue(), true)`。
- 在 `setup()` 中同步调用 `provide` / `inject`；异步逻辑应先取得注入结果，再复用引用。

常用于主题、用户信息、表单上下文和嵌套组件联动。组件外的应用注入上下文见 [hasInjectionContext](017-hasInjectionContext.md)。

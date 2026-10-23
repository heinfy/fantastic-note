---
sidebar_position: 3
---

# setup 与 script setup

`setup()` 是组合式 API 的入口，在选项式 API 的 `beforeCreate`、`created` 之前执行，其中不能通过 `this` 访问组件实例。`<script setup>` 是单文件组件的编译语法糖，顶层变量与函数可直接用于模板。

## setup 的参数与返回值

- `props`：响应式的组件输入，应按只读数据使用；普通 JavaScript 解构基本类型属性会丢失后续更新。
- `context.attrs`：未声明为 props 或 emits 的透传属性，保持最新值，但不能当作响应式数据侦听。
- `context.slots`：父组件提供的插槽函数。
- `context.emit`：触发组件事件。
- `context.expose`：定义父组件通过模板 ref 可访问的业务属性与方法。

`context` 可以解构；`setup()` 可返回供模板使用的对象，也可以返回渲染函数。

```vue
<script>
import { computed, toRef } from 'vue';

export default {
  props: { count: { type: Number, default: 0 } },
  emits: ['update:count'],
  setup(props, { emit, expose }) {
    const count = toRef(props, 'count');
    const doubleCount = computed(() => count.value * 2);
    const increment = () => emit('update:count', props.count + 1);

    expose({ increment });
    return { doubleCount, increment };
  }
};
</script>

<template>
  <button @click="increment">两倍计数：{{ doubleCount }}</button>
</template>
```

不要用 `return { count: props.count }` 保存基本类型 prop 的快照；保留 `props.count` 的访问或使用 `toRef()`。

## script setup 与编译宏

宏由编译器处理，不需要从 `vue` 导入；`ref`、`computed` 等运行时函数仍需导入。

- `defineProps()`：声明 props。
- `defineEmits()`：声明组件事件。
- `defineExpose()`：定义组件公开接口。
- `defineOptions()`（Vue 3.3+）：声明 `name`、`inheritAttrs` 等选项。
- `defineSlots()`（Vue 3.3+）：为插槽提供 TypeScript 类型。
- `defineModel()`（Vue 3.4+）：声明用于 `v-model` 的 prop 与更新事件，返回可读写 ref。
- `withDefaults()`：为基于类型声明的 props 指定默认值。

```vue
<script setup>
import { computed } from 'vue';

const props = defineProps({ count: { type: Number, default: 0 } });
const emit = defineEmits(['update:count']);
const doubleCount = computed(() => props.count * 2);
const increment = () => emit('update:count', props.count + 1);
defineExpose({ increment });
</script>

<template>
  <button @click="increment">两倍计数：{{ doubleCount }}</button>
</template>
```

Vue 3.5+ 对同一 `<script setup>` 内的 `defineProps()` 解构提供编译支持，可保留响应性；这不适用于普通 `setup(props)` 的解构。向 `watch` 或组合函数传递解构后的 prop 时，仍需使用 getter，例如 `() => count`。

## 控制组件的公开接口

普通 `setup()` 未调用 `expose()` 时，返回给模板的属性通常也可通过组件 ref 访问；调用 `expose({})` 可以隐藏业务属性。`<script setup>` 默认封闭，需使用 `defineExpose()`。

```vue
<!-- Child.vue -->
<script setup>
import { ref } from 'vue';

const input = ref(null);
const count = ref(0);
const focus = () => input.value?.focus();
defineExpose({ focus, count });
</script>

<template>
  <input ref="input" />
</template>
```

```vue
<!-- Parent.vue -->
<script setup>
import { onMounted, ref } from 'vue';
import Child from './Child.vue';

const child = ref(null);
onMounted(() => {
  child.value.focus();
  console.log(child.value.count); // 公开实例会自动解包 ref，无需再访问 .value。
});
</script>

<template>
  <Child ref="child" />
</template>
```

公开接口只影响外部访问，不影响组件自身模板。详见 [setup API](https://cn.vuejs.org/api/composition-api-setup.html) 和 [script setup](https://cn.vuejs.org/api/sfc-script-setup.html)。

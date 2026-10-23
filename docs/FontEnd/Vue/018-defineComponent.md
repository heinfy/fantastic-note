---
sidebar_position: 18
---

# defineComponent

`defineComponent()` 主要为 TypeScript 提供组件选项的类型推导，使 props、emits、`this` 等获得准确提示。

## 组件选项示例

```ts
import { defineComponent } from 'vue';

export default defineComponent({
  props: { message: { type: String, required: true } },
  emits: { submit: (value: string) => typeof value === 'string' },
  data() {
    return { count: 0 };
  },
  methods: {
    submit() {
      this.$emit('submit', this.message);
    }
  }
});
```

手写 `setup()` 的组件也可以使用 `defineComponent()`。纯 JavaScript 组件可直接导出选项对象；`<script setup>` 的类型由编译器处理，一般无需手动包装。

## 运行时行为

对象参数形式主要原样返回组件选项，功能来自类型定义；它是运行时函数，不是 `defineProps()` 这样的编译宏，不能笼统认为调用必然在构建时被移除。

Vue 3.3+ 还支持函数签名形式，传入 setup 函数并可附加组件选项。具体签名见 [defineComponent API](https://cn.vuejs.org/api/general.html#definecomponent)。

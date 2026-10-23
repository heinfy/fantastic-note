---
sidebar_position: 4
---

# Vue 2 中程序化挂载组件

普通父子关系直接在模板中声明组件即可。需要将组件挂到指定 DOM 容器时，可手动创建 Vue 2 实例，并负责销毁；Vue 3 的独立应用用 `createApp()`。

## 创建、挂载与清理

```vue
<!-- Parent.vue -->
<script>
import Vue from 'vue';
import Child from './Child.vue';

export default {
  data: () => ({ message: '父页面数据' }),
  created() { this.childInstance = null; },
  beforeDestroy() { this.removeChild(); },
  methods: {
    mountChild() {
      this.removeChild();
      this.childInstance = new Vue({
        parent: this,
        render: h => h(Child, {
          props: { message: this.message },
          on: { 'child-event': value => { this.message = value; } }
        })
      }).$mount();
      this.$refs.container.appendChild(this.childInstance.$el);
    },
    removeChild() {
      if (!this.childInstance) return;
      this.childInstance.$destroy();
      this.childInstance.$el.remove();
      this.childInstance = null;
    }
  }
};
</script>

<template>
  <div>
    <p>{{ message }}</p>
    <button @click="mountChild">挂载子组件</button>
    <div ref="container" />
  </div>
</template>
```

```vue
<!-- Child.vue -->
<script>
export default { props: { message: String } };
</script>

<template>
  <div>
    <p>{{ message }}</p>
    <button @click="$emit('child-event', '子组件数据')">回复父组件</button>
  </div>
</template>
```

挂载前清理旧实例，避免重复点击产生多个组件；父组件销毁时同时销毁手动创建的实例。不要只移除 DOM 而保留实例。相关流程见 [Vue.extend](../02-Vue%20内置语法/003-Vue.extend.md)。

---
sidebar_position: 21
---

# component 动态组件

`<component :is="value">` 根据绑定值选择要渲染的组件或元素。常用于选项卡、步骤向导和动态布局。

## 组件对象与缓存

```vue
<!-- App.vue -->
<script setup>
import { shallowRef } from 'vue';
import Profile from './Profile.vue';
import Settings from './Settings.vue';

const current = shallowRef(Profile);
</script>

<template>
  <button @click="current = Profile">资料</button>
  <button @click="current = Settings">设置</button>
  <KeepAlive>
    <component :is="current" />
  </KeepAlive>
</template>
```

```vue
<!-- Settings.vue -->
<script setup>
import { ref } from 'vue';
const darkMode = ref(false);
</script>

<template>
  <label><input v-model="darkMode" type="checkbox" />深色模式</label>
</template>
```

```vue
<!-- Profile.vue -->
<template>
  <p>用户资料</p>
</template>
```

用 `shallowRef()` 保存组件对象，避免对组件定义进行深度响应式转换。去掉 `KeepAlive` 后，切换组件会卸载旧实例，再次进入时重新创建；保留状态需要缓存。

## 使用组件名字符串

字符串对应已注册的组件名时，会解析为该组件；也可以是原生标签名，如 `'div'`。

```js
export default {
  components: { Profile, Settings },
  data() { return { currentName: 'Profile' }; }
};
```

```vue
<component :is="currentName" />
```

在 `<script setup>` 中仅声明 `const components = { Profile, Settings }` 不等于注册字符串名称；可直接写 `:is="components[currentName]"` 传入组件对象。

HTML 中的 `is="vue:..."` 用途见 [is 属性](022-is%20属性.md)。

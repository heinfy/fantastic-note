在 Vue 3 中，**`<component>` 是一个内置的动态组件标签**，它的作用是：**根据绑定的值动态地切换不同的组件**。

---

## 什么是 `<component>`？

- 它不是一个具体的 UI 组件，而是一个**语法糖/占位符**。
- 通过 `:is` 属性指定要渲染的组件（可以是组件对象、组件名字符串、或异步组件）。
- 常用于**选项卡、步骤向导、动态表单、路由视图（简化版）**等需要动态切换内容的场景。

> ✅ 本质：让同一个 DOM 位置，在不同时间渲染不同的组件。

---

## 基本语法

```vue
<component :is="currentComponent" />
```

其中 `currentComponent` 可以是：
- 组件对象（如 `import` 进来的）
- 注册的组件名（字符串，需全局或局部注册）
- 异步组件（通过 `defineAsyncComponent`）

---

## 案例：动态切换用户资料页和设置页

- 步骤 1：创建两个子组件

**Profile.vue**
```vue
<template>
  <div class="profile">
    <h2>👤 用户资料</h2>
    <p>姓名：张三</p>
    <p>邮箱：zhangsan@example.com</p>
  </div>
</template>
```

**Settings.vue**
```vue
<template>
  <div class="settings">
    <h2>⚙️ 设置</h2>
    <label>
      <input type="checkbox" v-model="darkMode" /> 深色模式
    </label>
    <p>当前主题：{{ darkMode ? '深色' : '浅色' }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const darkMode = ref(false)
</script>
```

---

- 步骤 2：在父组件中使用 `<component :is>`

**App.vue**
```vue
<template>
  <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
    <h1>动态组件示例</h1>

    <!-- 切换按钮 -->
    <div style="margin-bottom: 20px;">
      <button @click="current = 'Profile'">查看资料</button>
      <button @click="current = 'Settings'">打开设置</button>
    </div>

    <!-- 动态组件容器 -->
    <component :is="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Profile from './Profile.vue'
import Settings from './Settings.vue'

// 注意：这里用的是组件对象，不是字符串！
const current = ref(Profile)

// 如果你想用字符串名，需要注册组件（见下方说明）
</script>
```

> 点击按钮即可在“资料”和“设置”之间切换，且 **Settings 中的复选框状态会被保留**（因为组件实例未销毁）。

---

## 补充：使用字符串组件名（需注册）

如果你希望用字符串（如 `'Profile'`）作为 `:is` 的值，必须先注册组件：

```js
// 在 script setup 中局部注册
const components = {
  Profile,
  Settings
}

// 模板中
<component :is="currentName" />

// 其中 currentName 是 'Profile' 或 'Settings'
```

但更推荐直接使用**组件对象**（如上面案例），避免命名冲突，也更符合 Composition API 风格。

---

## 高级技巧：结合 `<KeepAlive>` 缓存状态

如果你切换后希望**保留组件状态**（比如设置页的开关状态），可以用 `<KeepAlive>` 包裹：

```vue
<KeepAlive>
  <component :is="current" />
</KeepAlive>
```

这样即使切换走再回来，组件也不会重新创建，数据保持不变。

---

## 总结

| 特性 | 说明 |
|------|------|
| **作用** | 动态渲染不同组件 |
| **核心属性** | `:is`（绑定组件对象或名称） |
| **典型场景** | 选项卡、多步骤表单、动态布局 |
| **搭配使用** | 常与 `<KeepAlive>`、`v-if`、异步组件一起用 |

---
sidebar_position: 2
---

# app.mount

`app.mount(container)` 将根组件渲染到指定容器，并返回根组件的公开实例。

## 基本用法

```js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);
const vm = app.mount('#app');
// 也可以传入实际的 DOM 元素。
```

容器必须存在。同一个应用实例只能挂载一次；需要重新创建应用时，应创建新的 `app`。

## 挂载流程

1. **解析容器**：字符串通过 `document.querySelector()` 查找，也支持 DOM 元素。
2. **准备模板**：若根组件没有 `render` 或 `template`，支持运行时编译的构建可使用容器内容作为模板；普通客户端挂载会清空容器原有内容。
3. **创建根 VNode**：记录根组件、根 props，并关联应用上下文。
4. **初始化组件**：执行 `setup()`，初始化选项式 API 中的状态与方法。
5. **首次渲染**：建立渲染副作用，调用渲染函数，收集读取到的响应式依赖，再将 VNode 挂载为真实 DOM。
6. **完成挂载**：执行挂载生命周期，记录应用的挂载状态，返回组件公开实例。

`ref` / `reactive` 可以在挂载前创建；挂载过程主要建立组件渲染与响应式数据之间的依赖关系。

## 返回值与卸载

`mount()` 返回的公开实例与 `createApp()` 返回的应用对象不同。`<script setup>` 组件的业务属性默认不公开，需通过 `defineExpose()` 显式暴露。

```js
app.unmount(); // 卸载组件树并运行清理钩子。
```

SSR 已生成的页面需要水合，使用 `createSSRApp()`。生命周期见 [Vue 3 的生命周期](005-Vue%203%20的生命周期.md)。

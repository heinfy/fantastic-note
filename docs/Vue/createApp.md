`createApp` 是 Vue 3 中创建应用实例的**核心入口函数**，它取代了 Vue 2 中的 `new Vue()`。理解 `createApp` 的作用，是掌握 Vue 3 应用初始化机制的关键。

---

## 一、基本用法回顾

```js
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App); // 创建应用实例
app.mount('#app');          // 挂载到 DOM
```

这里 `createApp(App)` 并**不会立即渲染或挂载组件**，它只是**创建一个应用实例对象（app instance）**，后续通过 `.mount()` 才真正启动应用。

---

## 二、`createApp` 做了哪些事？

### 1. **创建一个独立的 Vue 应用上下文（Application Context）**

Vue 3 强调“多实例隔离”。每个 `createApp()` 调用都会创建一个**完全独立的应用上下文**，包括：

- 独立的插件注册空间（`app.use()`）
- 独立的全局组件注册（`app.component()`）
- 独立的指令注册（`app.directive()`）
- 独立的混入（`app.mixin()`）
- 独立的配置（`app.config`）

> ✅ 这解决了 Vue 2 中“全局污染”问题：多个 Vue 应用共享同一个全局配置，容易冲突。

---

### 2. **封装根组件选项**

传入的 `App`（可以是组件选项对象或定义好的组件）会被作为**根组件（root component）** 存储在应用实例中，但**不会立即处理**。

例如：

```js
const App = {
  setup() {
    return () => h('div', 'Hello');
  }
};
const app = createApp(App);
```

此时 `App` 只是被记录下来，等 `.mount()` 时才会被编译、实例化、渲染。

---

### 3. **提供一套应用级 API（Application API）**

`createApp` 返回的对象（称为 **app instance**）包含一系列方法，用于配置整个应用：

| 方法 | 作用 |
|------|------|
| `.use(plugin, options?)` | 注册插件 |
| `.component(name, component?)` | 注册/获取全局组件 |
| `.directive(name, directive?)` | 注册/获取全局指令 |
| `.mixin(mixin)` | 添加全局 mixin（不推荐） |
| `.provide(key, value)` | 设置应用级依赖注入（所有组件可 inject） |
| `.config` | 访问应用配置（如 errorHandler、compilerOptions 等） |

这些配置**只对当前 app 实例生效**，不影响其他 `createApp` 创建的应用。

---

### 4. **不执行任何 DOM 操作（延迟挂载）**

`createApp` **纯逻辑操作**，不涉及 DOM。真正的挂载、渲染、响应式系统激活，是在调用 `.mount()` 时才发生的。

这使得你可以：

- 先配置插件、全局组件
- 再挂载，保证初始化顺序可控
- 在 SSR（服务端渲染）中复用相同逻辑

---

## 三、内部大致流程（简化版）

虽然具体实现复杂，但逻辑上 `createApp(rootComponent, rootProps?)` 大致做了以下几步：

1. **创建应用上下文对象**  
   初始化一个空的上下文，包含：
   - `_component`: 根组件
   - `_props`: 根组件 props
   - `_container`: 挂载容器（初始为 null）
   - `_instance`: 根组件实例（初始为 null）
   - 插件、组件、指令的注册表（Map 或对象）

2. **绑定应用级方法**  
   将 `use`, `component`, `directive`, `provide`, `config` 等方法绑定到该上下文。

3. **返回带有 `.mount()` 的 app 对象**  
   `.mount(container)` 内部会：
   - 调用 `createVNode(rootComponent, rootProps)`
   - 调用 `render(vnode, container)`（来自 `@vue/runtime-dom`）
   - 触发根组件的创建、setup、渲染等完整生命周期

---

## 四、与 Vue 2 的对比

| 特性 | Vue 2 (`new Vue`) | Vue 3 (`createApp`) |
|------|------------------|---------------------|
| 是否支持多实例隔离 | ❌ 全局配置共享 | ✅ 每个 app 独立 |
| 插件注册 | `Vue.use()`（全局） | `app.use()`（仅当前 app） |
| 全局组件 | `Vue.component()` | `app.component()` |
| 挂载方式 | `new Vue({ el: '#app' })` | `createApp(App).mount('#app')` |
| Tree-shaking 支持 | ❌ 不支持 | ✅ 支持（按需引入 API） |

---

## 五、高级用法示例

### 1. 多个独立 Vue 应用

```js
const app1 = createApp(App1);
app1.component('MyButton', MyButton);
app1.mount('#app1');

const app2 = createApp(App2);
// app2 无法使用 MyButton，完全隔离
app2.mount('#app2');
```

### 2. 应用级 provide/inject

```js
const app = createApp(App);
app.provide('theme', 'dark'); // 所有组件可通过 inject('theme') 获取
app.mount('#app');
```

### 3. 配置全局错误处理

```js
const app = createApp(App);
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err);
};
app.mount('#app');
```

---

## 六、总结

`createApp` 的核心作用是：

✅ **创建一个隔离的、可配置的 Vue 应用容器**  
✅ **延迟挂载，先配置后启动**  
✅ **提供应用级 API（插件、组件、指令、provide 等）**  
✅ **支持多实例共存，避免全局污染**

它本身不做渲染，只是一个“应用工厂”，真正的渲染由 `.mount()` 触发。这种设计让 Vue 3 更模块化、更灵活，也更适合微前端、嵌入式组件等场景。

> `app.mount('#app')` 是 Vue 3 应用启动的**关键一步**，它将之前通过 `createApp()` 创建的**应用实例**挂载到指定的 DOM 元素上，并完成整个应用的初始化和首次渲染。

---

## 一、基本作用

`createApp(App).mount('#app')`

- 将根组件 `App` 渲染到 `#app` 这个 DOM 容器中
- 启动响应式系统、组件树、生命周期等完整 Vue 运行时机制
- **首次真正操作 DOM**

> ⚠️ 注意：`createApp` 只是“准备”，`mount` 才是“启动”。

---

## 二、`mount` 方法的完整执行流程

### 1. **解析容器（container）**

- 如果传入的是字符串（如 `'#app'`），会自动调用 `document.querySelector`
- 也支持直接传入 DOM 元素：`mount(document.getElementById('app'))`

---

### 2. **替换容器内容（可选）**

- Vue 会把容器当作“挂载点”，其内部 HTML 会被完全覆盖

> 📌 例如：
> ```html
> <div id="app">原有内容</div>
> ```
> 挂载后变成：
> ```html
> <div id="app">Vue 渲染的内容</div>
> ```

---

### 3. **创建根 VNode（虚拟 DOM 节点）**
```js
const vnode = createVNode(rootComponent, rootProps);
```
- `rootComponent` 是你在 `createApp(App)` 中传入的组件
- `rootProps` 是可选的第二个参数（很少用）
- `createVNode` 构建一个描述根组件的虚拟节点对象

---

### 4. **关联应用上下文**
- 将当前 `app` 实例的上下文（插件、全局组件、provide 等）绑定到根组件实例
- 根组件可以通过 `getCurrentInstance().appContext` 访问这些信息

---

### 5. **调用底层渲染器（renderer）进行挂载**
核心代码类似于：
```js
renderer.render(vnode, container);
```
其中 `renderer` 来自 `@vue/runtime-dom`，它负责：

#### a) **创建根组件实例**
- 调用 `setup()`（Composition API）
- 初始化 `data`、`methods`、`computed`、`watch` 等（Options API）
- 触发 `beforeCreate` → `created`（如果使用 Options API）

#### b) **执行响应式依赖收集**
- 所有 `ref`、`reactive` 数据被 `Proxy` 包裹，进入响应式系统
- `computed` 和 `watch` 开始工作

#### c) **首次渲染（patch）**
- 调用组件的 `render` 函数（或编译 `<template>` 得到的 render 函数）
- 生成真实 DOM 并插入到 `container` 中

#### d) **触发挂载生命周期**
- `onBeforeMount` / `beforeMount`
- `onMounted` / `mounted`

> ✅ 此时用户看到页面内容

---

### 6. **缓存根组件实例 & 返回根组件实例的公开代理（proxy）**
- `mount` 方法**返回根组件实例的 proxy 对象**（用于调试或测试）
  ```js
  const vm = app.mount('#app');
  console.log(vm); // 可访问 data、methods 等（仅开发环境可靠）
  ```
- 内部会记录 `_instance`，防止重复挂载

---

### 7. **标记已挂载，防止重复调用**
- 同一个 `app` 实例不能多次 `mount`
- 第二次调用会警告或报错（避免内存泄漏）

---

## 三、总结

`app.mount('#app')` 的核心作用是：

✅ **启动 Vue 应用**  
✅ **创建根组件实例并激活响应式系统**  
✅ **渲染虚拟 DOM 到真实 DOM 容器**  
✅ **触发完整的生命周期钩子**  
✅ **完成从“配置”到“运行”的转变**

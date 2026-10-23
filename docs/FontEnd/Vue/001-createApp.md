---
sidebar_position: 1
---

# createApp

`createApp(rootComponent, rootProps?)` 创建一个独立的 Vue 3 应用实例。它保存根组件与应用配置，调用 `mount()` 后才创建组件树并渲染。

## 基本用法

```js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(router);
app.provide('theme', 'dark');
app.config.errorHandler = (error, instance, info) => {
  console.error(info, error);
};
app.mount('#app');
```

插件、全局组件、指令和依赖注入应在挂载前配置。

## 应用级 API

- `app.use(plugin, options)`：安装插件；同一插件在当前应用中只安装一次。
- `app.component(name, component)` / `app.directive(name, directive)`：注册组件或指令；省略第二个参数可读取注册结果。
- `app.provide(key, value)`：提供应用级依赖。
- `app.config`：配置错误处理、全局属性等。
- `app.mixin(mixin)`：添加全局混入，影响范围大，应用逻辑优先使用组合函数。
- `app.mount(container)` / `app.unmount()`：挂载与卸载应用。

## 初始化流程

1. 保存根组件及可选的根 props。
2. 创建应用上下文，维护组件、指令、依赖注入和配置。
3. 返回应用对象，供调用方完成配置。
4. 调用 `mount()` 时创建根 VNode，将应用上下文交给渲染器。

## 多应用与 Vue 2 的区别

```js
const app1 = createApp(App1);
app1.component('MyButton', MyButton);
app1.mount('#app1');

const app2 = createApp(App2);
app2.mount('#app2');
```

两个应用的注册与配置相互独立。Vue 2 使用 `new Vue()`，组件和插件通常通过 `Vue.component()`、`Vue.use()` 全局注册；Vue 3 将这些配置放在应用实例上。

服务端渲染与客户端水合使用 `createSSRApp()`。挂载流程见 [app.mount](002-app%20的%20mount%20方法.md)。

---
sidebar_position: 1
---

# 导航守卫

导航守卫用于检查权限、取消或重定向导航。以下以 Vue 3 + Vue Router 4 为主。

## 守卫类型

- 全局前置：`router.beforeEach()`。
- 全局解析：`router.beforeResolve()`，在组件内守卫和异步路由组件解析之后运行。
- 全局后置：`router.afterEach()`，用于统计等逻辑，不能阻止导航。
- 路由独享：路由配置中的 `beforeEnter`；同一路由的 params、query 或 hash 改变不会再次触发它。
- 组件内：`beforeRouteEnter`、`beforeRouteUpdate`、`beforeRouteLeave`。
- 组合式 API：`onBeforeRouteUpdate()`、`onBeforeRouteLeave()`；没有 `onBeforeRouteEnter()`，首次进入逻辑可写在 setup 中。

## 权限检查示例

```js
import { createRouter, createWebHistory } from 'vue-router';
import Login from './Login.vue';
import Profile from './Profile.vue';
import { isAuthenticated } from './auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/profile', component: Profile, meta: { requiresAuth: true } }
  ]
});

router.beforeEach(to => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
});
```

返回 `false` 取消导航，返回路由位置重定向，不返回值或返回 `true` 则继续。守卫可返回 Promise；Vue Router 3 常见的 `next()` 风格在 Router 4 仍支持，但每条分支必须准确调用一次。

## 导航执行顺序

1. 触发导航，调用将离开组件的 `beforeRouteLeave`。
2. 调用全局 `beforeEach`。
3. 调用复用组件的 `beforeRouteUpdate`。
4. 调用路由 `beforeEnter`，解析异步路由组件。
5. 调用将进入组件的 `beforeRouteEnter`。
6. 调用全局 `beforeResolve`，确认导航。
7. 调用 `afterEach`，触发 DOM 更新，再调用 `beforeRouteEnter` 中通过 `next(vm => ...)` 注册的回调。

`beforeRouteEnter` 执行时组件实例尚未创建，不能访问 `this`；更新与离开守卫可访问已有实例。组件的 `created`、`mounted` 属于组件生命周期，不应与路由守卫列为同一组。

参考：[导航守卫](https://router.vuejs.org/zh/guide/advanced/navigation-guards.html)。

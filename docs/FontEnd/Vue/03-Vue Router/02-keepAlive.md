---
sidebar_position: 2
---

# 路由组件缓存

`KeepAlive` 缓存路由组件实例，使返回页面时可以恢复组件状态。它是 Vue 内置组件，路由场景需要配合 `RouterView`。

## Vue Router 4 写法

```vue
<RouterView v-slot="{ Component }">
  <KeepAlive include="MainList" :max="10">
    <component :is="Component" />
  </KeepAlive>
</RouterView>
```

缓存实际路由组件，而不是 `RouterView` 本身。Vue Router 3 中常见的写法是直接用 `<keep-alive><router-view /></keep-alive>`。

## 缓存范围与生命周期

- `include` / `exclude`：匹配组件的 `name`，不是路由配置的 `name`；支持逗号分隔字符串、正则表达式或数组。
- `max`：限制实例数量，超过时移除最近最少使用的实例。
- `onActivated` / `activated`：首次挂载与从缓存恢复时执行。
- `onDeactivated` / `deactivated`：组件进入缓存或卸载时执行。

Vue 3.3+ 可在页面中用 `defineOptions({ name: 'MainList' })` 显式设置名称。列表重取数据、连接暂停或恢复可以放在激活、停用钩子中。

## 刷新与状态边界

改变组件 key 可创建新的缓存实例，但旧 key 对应的实例可能仍留在缓存中，需结合容量或缓存范围管理。`$forceUpdate()` 只强制渲染，不会清空实例状态。

表单等响应式状态可以保留；滚动位置等 DOM 状态需要按场景单独保存与恢复。通用说明见 [内置组件](../020-内置组件.md)。

参考：[RouterView 插槽](https://router.vuejs.org/zh/guide/advanced/router-view-slot.html)。

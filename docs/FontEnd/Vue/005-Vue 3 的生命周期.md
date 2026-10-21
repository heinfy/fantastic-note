Vue 3 的生命周期描述了组件从**创建 → 挂载 → 更新 → 卸载**的全过程。根据使用的 API 风格不同（**选项式 API** 或 **组合式 API**），生命周期钩子的写法也有所不同。

---

## ✅ 一、组合式 API（Composition API）中的生命周期钩子

在 `<script setup>` 或 `setup()` 函数中使用，需从 `vue` 中显式导入：

```js
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onActivated,
  onDeactivated,
  onRenderTracked,
  onRenderTriggered
} from 'vue'
```

### 常用生命周期钩子（按执行顺序）：

| 阶段 | 钩子函数 | 说明 |
|------|----------|------|
| **挂载前** | `onBeforeMount` | 模板已编译为虚拟 DOM，但尚未挂载到真实 DOM |
| **挂载后** | `onMounted` | 组件已挂载到页面，可安全操作 DOM、发起请求等 |
| **更新前** | `onBeforeUpdate` | 响应式数据已变化，但 DOM 尚未更新 |
| **更新后** | `onUpdated` | DOM 已重新渲染，反映最新数据 |
| **卸载前** | `onBeforeUnmount` | 组件即将被销毁，适合清理工作（如清除定时器、解绑事件） |
| **卸载后** | `onUnmounted` | 组件已完全销毁，所有绑定和子组件均已移除 |

### 其他特殊钩子：

- `onErrorCaptured`：捕获子组件抛出的错误（可用于错误边界）
- `onActivated` / `onDeactivated`：配合 `<keep-alive>` 使用，组件被激活/停用时触发
- `onRenderTracked` / `onRenderTriggered`：仅在开发模式下可用，用于调试响应式依赖

> ⚠️ 注意：  
> - `beforeCreate` 和 `created` 在组合式 API 中**不再单独使用**，其逻辑直接写在 `setup()` 函数顶部。
> - 所有 `onXxx` 钩子**必须在 `setup()` 中同步调用**，不能在异步函数或条件语句中延迟注册。

---

## ✅ 二、选项式 API（Options API）中的生命周期钩子

与 Vue 2 类似，但部分名称变更：

| Vue 2 名称 | Vue 3 名称 | 说明 |
|-----------|-----------|------|
| `beforeCreate` | ✅ 保留 | 实例初始化前，无法访问 data/methods |
| `created` | ✅ 保留 | 实例创建完成，可访问 data/methods，但无 DOM |
| `beforeMount` | ✅ 保留 | 模板编译完成，未挂载 |
| `mounted` | ✅ 保留 | 已挂载，可操作 DOM |
| `beforeUpdate` | ✅ 保留 | 数据更新，DOM 未更新 |
| `updated` | ✅ 保留 | DOM 已更新 |
| `beforeDestroy` | ❌ 废弃 → **`beforeUnmount`** | 组件销毁前 |
| `destroyed` | ❌ 废弃 → **`unmounted`** | 组件销毁后 |
| `activated` / `deactivated` | ✅ 保留 | 用于 `<keep-alive>` 缓存组件 |

---

## ✅ 三、生命周期执行顺序总结（以组合式 API 为例）

1. `setup()`（相当于 beforeCreate + created）
2. `onBeforeMount`
3. `onMounted`
4. （当数据变化时）→ `onBeforeUpdate` → `onUpdated`
5. （组件卸载时）→ `onBeforeUnmount` → `onUnmounted`

---

## ✅ 四、典型使用场景

- **`onMounted`**：发起 API 请求、初始化第三方库（如 ECharts）、获取 DOM 元素
- **`onBeforeUnmount`**：清除 `setInterval`、移除全局事件监听、取消订阅
- **`onUpdated`**：谨慎使用！避免在此修改状态，否则可能引发无限更新循环

---

如需代码示例或父子组件生命周期执行顺序，也可以继续问我！
`hasInjectionContext` 是 Vue 3 内部的一个**运行时函数**，用于**判断当前代码是否处于一个有效的注入上下文（injection context）中**，也就是说，是否在 `setup()` 函数、生命周期钩子、或 `<script setup>` 等 **组件实例已经创建的环境中** 调用 `inject()`。

---

### 🎯 核心作用

确保 `inject()` 只能在**组件内部**调用，而不能在组件外部（例如普通工具函数、模块顶层）调用，否则会抛出错误：

> `[Vue warn]: inject() can only be used inside setup() or functional components.`

`hasInjectionContext()` 就是 Vue 用来做这个检查的内部方法。

---

### 🔍 技术细节（源码层面）

在 Vue 3 源码中（如 `packages/runtime-core/src/apiInject.ts`），`inject` 的实现大致如下（简化版）：

```ts
export function inject(
  key: InjectionKey<any> | string,
  defaultValue?: unknown,
  treatDefaultAsFactory = false
) {
  // 检查当前是否有 active effect scope / 组件实例
  if (!hasInjectionContext()) {
    warn(`inject() can only be used inside setup() or functional components.`)
    return
  }

  const instance = currentInstance!
  // ... 从祖先的 provides 中查找 key
}
```

而 `hasInjectionContext()` 的本质是检查 `currentInstance` 是否存在（即当前是否有活跃的组件实例）：

```ts
export const hasInjectionContext = (): boolean => {
  return currentInstance !== null
}
```

> `currentInstance` 是 Vue 内部维护的一个全局变量，指向当前正在执行 `setup()` 的组件实例。在组件外（如模块顶层、setTimeout 回调、普通函数中），它为 `null`。

---

### ❌ 错误示例：在组件外调用 inject

```js
// utils.js
import { inject } from 'vue'

// ❌ 错误！模块顶层没有组件上下文
const theme = inject('theme') // 报错或返回 undefined + 警告
```

### ✅ 正确用法：只在 setup 或 script setup 中使用

```vue
<!-- MyComponent.vue -->
<script setup>
import { inject } from 'vue'

// ✅ 正确：在 setup 上下文中
const theme = inject('theme')
</script>
```

---

### ⚠️ 常见陷阱

1. **在异步回调中直接使用 inject**（虽然 setup 已执行，但回调可能脱离上下文）：
   ```js
   setup() {
     setTimeout(() => {
       inject('xxx') // ❌ 错误！此时 currentInstance 已重置为 null
     }, 100)
   }
   ```
   **解决方法**：提前在 setup 中 inject 并保存引用：
   ```js
   setup() {
     const config = inject('config')
     setTimeout(() => {
       console.log(config.value) // ✅ 正确
     }, 100)
   }
   ```

2. **在组合式函数（Composables）中使用 inject** 是允许的，**只要该函数在 setup 中被调用**：
   ```js
   // useTheme.js
   export function useTheme() {
     return inject('theme') // ✅ 安全，因为 useTheme 在 setup 中调用
   }

   // Component.vue
   setup() {
     const theme = useTheme() // ✅ 正常工作
   }
   ```

---

### 总结

| 项目 | 说明 |
|------|------|
| `hasInjectionContext()` | Vue 内部函数，检查当前是否有组件实例上下文 |
| 用途 | 确保 `inject()` 只在合法位置调用 |
| 开发者是否需要直接使用？ | **不需要**，它是 Vue 内部机制 |
| 报错提示 | 当你在非组件上下文调用 `inject()` 时，Vue 会通过它检测并警告 |

> 💡 作为开发者，你只需记住：**`inject()` 必须在 `setup()`、`<script setup>` 或由它们直接/间接调用的函数中使用**。

如有更多关于组合式 API 或依赖注入的问题，欢迎继续提问！
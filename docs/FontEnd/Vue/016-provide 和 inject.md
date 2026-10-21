Vue 3 中的 `provide` 和 `inject` 是一种**跨层级组件通信**的方式，用于祖先组件向任意后代组件传递数据（包括响应式数据），而无需通过逐层 prop 传递。

---

## 一、基本用法

### 1. 祖先组件：使用 `provide`

```js
// Parent.vue
import { provide, ref } from 'vue'

export default {
  setup() {
    const message = ref('Hello from parent')

    // 提供一个值给后代组件
    provide('message', message)

    return {
      message
    }
  }
}
```

> 注意：`provide` 的第一个参数是 **注入 key**（通常建议使用 Symbol 或字符串常量避免命名冲突），第二个参数是要提供的值。

---

### 2. 后代组件：使用 `inject`

```js
// Child.vue
import { inject } from 'vue'

export default {
  setup() {
    // 注入祖先提供的值
    const message = inject('message', 'default value') // 第二个参数是默认值（可选）

    return {
      message
    }
  }
}
```

---

## 二、响应式支持

### 1. 提供响应式对象（推荐）

如果提供的是 `ref` 或 `reactive` 对象，**注入方会自动获得响应性**：

```js
// Parent.vue
const count = ref(0)
provide('count', count)
```

```js
// GrandChild.vue
const count = inject('count')
// count 是响应式的，当父组件修改 count.value，这里会自动更新
```

### 2. 允许后代组件修改 provide 的值（谨慎使用）

如果希望后代组件能修改 provide 的数据，可以提供一个**修改方法**或**整个 ref**：

#### 方式一：提供 setter 函数

```js
// Parent.vue
const count = ref(0)

provide('count', readonly(count)) // 防止直接修改
provide('setCount', (value) => {
  count.value = value
})
```

```js
// Child.vue
const count = inject('count')
const setCount = inject('setCount')

// 使用
setCount(10)
```

#### 方式二：直接提供 ref（不推荐，破坏封装）

```js
provide('count', count) // 后代可以直接修改 count.value
```

> 更安全的做法是使用 `readonly` 包裹：

```js
import { readonly } from 'vue'
provide('count', readonly(count))
```

---

## 三、注意事项

- `provide/inject` **不是响应式 prop 的替代品**，应仅用于跨多层组件传递全局/上下文数据（如主题、用户信息、i18n 等）。
- 不要在应用的根组件以外滥用，避免造成“隐式依赖”，降低组件可复用性。
- 如果只是父子组件通信，优先使用 props / emits。

---

## 四、典型应用场景

- 主题切换（ThemeContext）
- 用户登录状态
- 表单校验上下文（如 Element Plus 的 Form）
- 多级菜单或嵌套 Tab 的联动控制

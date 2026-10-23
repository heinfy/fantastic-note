---
sidebar_position: 17
---

# hasInjectionContext

`hasInjectionContext()` 是 Vue 3.3+ 的公共 API，用于判断当前代码是否有可用的 `inject()` 上下文，常用于封装支持注入的组合函数。

## 在组合函数中检查上下文

```js
import { hasInjectionContext, inject } from 'vue';

export function useTheme() {
  return hasInjectionContext() ? inject('theme', 'light') : 'light';
}
```

在组件 `setup()` 中调用 `useTheme()` 时可以获取注入值；模块顶层或普通异步回调通常没有组件上下文，将返回默认主题。

## 应用级上下文

Vue 3.3+ 的 `app.runWithContext()` 允许同步回调访问应用级 `provide`，即使此时没有活跃组件。

```js
import { createApp, hasInjectionContext, inject } from 'vue';
import App from './App.vue';

const app = createApp(App);
app.provide('theme', 'dark');

const theme = app.runWithContext(() => {
  console.log(hasInjectionContext()); // true
  return inject('theme');
});
console.log(theme); // 'dark'
```

`runWithContext()` 只覆盖回调的同步执行期间，不会自动为 `await` 之后或 `setTimeout` 中的代码保留上下文。组件中的常见做法是先 `inject()`，再在异步回调中使用结果。

参考：[hasInjectionContext](https://cn.vuejs.org/api/composition-api-dependency-injection.html#hasinjectioncontext)。

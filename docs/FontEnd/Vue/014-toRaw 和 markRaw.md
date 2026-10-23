---
sidebar_position: 14
---

# toRaw 与 markRaw

`toRaw()` 取得 Vue 代理背后的原始对象；`markRaw()` 标记对象，使其不被转换为响应式代理。

## toRaw：临时取得原始引用

```js
import { reactive, toRaw, watchEffect } from 'vue';

const raw = { count: 0 };
const state = reactive(raw);
console.log(toRaw(state) === raw); // true

watchEffect(() => console.log(state.count));
raw.count = 1; // 绕过代理，不会通知依赖。
console.log(state.count); // 1，共享同一份数据。
state.count = 2; // 通过代理写入会通知依赖。
```

`toRaw()` 不克隆数据，也不递归移除所有嵌套代理。适合临时进行引用比较或与外部接口交互，避免长期交替操作原始引用与代理。

## markRaw：保留对象原样

```js
import { isReactive, markRaw, reactive } from 'vue';

class Editor {
  constructor() { this.content = ''; }
}

const editor = markRaw(new Editor());
const state = reactive({ editor });
console.log(state.editor === editor); // true
console.log(isReactive(state.editor)); // false
```

适合组件定义对象、第三方库实例等不需要 Vue 深度代理的值。应在对象进入响应式系统前标记；`markRaw()` 不会把已有 Proxy 转回原始对象。

## 嵌套对象与引用一致性

标记仅作用于当前对象，不会递归标记其子对象。

```js
const raw = markRaw({ nested: {} });
const state = reactive({ nested: raw.nested });
console.log(raw.nested === state.nested); // false
```

混用原始引用与代理时，注意 `===` 比较、Map 键等对对象身份的依赖。若数据需要更新视图，不要绕过代理批量写入；对大型不可变数据可用 [shallowRef](012-shallowRef、triggerRef%20和%20customRef.md) 后整体替换。

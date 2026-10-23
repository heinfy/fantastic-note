---
sidebar_position: 13
---

# shallowReactive 与 shallowReadonly

浅层 API 只处理根属性，嵌套值保持原样。适合根层变化需要响应、内部数据由其他机制管理的对象。

## shallowReactive

```js
import { isReactive, shallowReactive, watchEffect } from 'vue';

const state = shallowReactive({ count: 0, nested: { value: 1 } });
watchEffect(() => console.log(state.count, state.nested.value));

state.count++; // 根属性变更会通知依赖。
state.nested.value++; // 内部普通对象的修改不会通知。
state.nested = { value: 3 }; // 替换根属性会通知。

console.log(isReactive(state)); // true
console.log(isReactive(state.nested)); // false
```

浅层对象不自动解包内部 ref：若 `state.count` 存放 ref，仍需访问 `state.count.value`。

## shallowReadonly

```js
import { shallowReadonly } from 'vue';

const config = shallowReadonly({ theme: 'dark', options: { debug: true } });
config.theme = 'light'; // 写入被阻止。
config.options.debug = false; // 内部普通对象可修改。
```

浅层只读不自动赋予源对象响应性，也不移除嵌套值已有的响应性或只读性。深层只读视图的说明见 [readonly](008-readonly%20和%20shallowReadonly.md)。

## 使用边界

- 只需要观察根属性替换时用 `shallowReactive`；需要嵌套修改自动更新时用 `reactive`。
- 只保护根属性时用 `shallowReadonly`；需要保护深层写入时用 `readonly`。
- 将浅层状态作为独立根状态使用，避免混入深层响应式树，增加理解成本。
- 解构基本类型根属性仍会失去源属性关联，可使用 [toRefs](011-toRef%20和%20toRefs.md)。

浅层 API 可减少内部代理访问开销，收益取决于数据规模与访问方式。

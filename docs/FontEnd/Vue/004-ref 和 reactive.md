---
sidebar_position: 4
---

# ref、reactive 与 computed

`ref()` 保存可变状态，`reactive()` 代理对象，`computed()` 根据响应式依赖生成并缓存派生值。

## 基本用法

```js
import { computed, reactive, ref } from 'vue';

const count = ref(0);
const state = reactive({ user: { name: 'Alice' } });
const doubleCount = computed(() => count.value * 2);

count.value++;
state.user.name = 'Bob';
console.log(doubleCount.value); // 2
```

- `ref` 支持任意类型，JavaScript 中通过 `.value` 读写；作为模板顶层绑定时通常自动解包。
- `reactive` 支持对象、数组、Map、Set 等，直接访问属性；基本类型不能交给 `reactive()`。
- getter 形式的 `computed` 返回只读 ref；需要写入时传入 `{ get, set }`，在 setter 中修改源状态。

## 响应式原理

`ref` 通过 `.value` 的 getter / setter 收集与触发依赖；当值是可代理对象时，内部还会将其转为响应式代理。

`reactive` 使用 `Proxy` 拦截属性读取、修改与删除，按目标对象和属性收集依赖。嵌套对象在访问时转换，因此深度响应式不等于初始化时立即遍历全部对象。

```js
import { isReactive, ref, watchEffect } from 'vue';

const state = ref({ user: { name: 'Alice' } });
console.log(isReactive(state.value)); // true

watchEffect(() => console.log(state.value.user.name));
state.value.user.name = 'Bob'; // 由内部 Proxy 触发。
state.value = { user: { name: 'Charlie' } }; // 由 ref 的 setter 触发。
```

对象 ref 同时涉及 `.value` 与内部属性的依赖，不能概括为「修改任意属性都会通知所有读取该 ref 的副作用」。

## 如何选择

- 基本类型或经常整体替换的状态用 `ref`，例如查询参数、接口返回列表。
- 结构稳定、主要修改属性的对象可用 `reactive`。
- 可由其他状态计算得到的值用 `computed`，不要再维护一份重复状态。
- 大型不可变数据或第三方实例可考虑 [shallowRef](012-shallowRef、triggerRef%20和%20customRef.md)。

## 常见边界

```js
const state = reactive({ count: 0 });
const { count } = state; // 得到当前数字，后续 state.count 更新不会改变它。
```

需要解构时使用 [toRef / toRefs](011-toRef%20和%20toRefs.md)。另外，重新赋值 `reactive` 变量会让原有引用与依赖失去关联；需要整体替换时用 `ref`。

响应式对象中的 ref 属性通常自动解包；响应式数组元素与 Map 值中的 ref 不会自动解包，仍需 `.value`。

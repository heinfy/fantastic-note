---
sidebar_position: 11
---

# toRef 与 toRefs

`toRef()` 为对象属性建立 ref 引用，`toRefs()` 批量转换属性，使解构后的变量仍与源对象关联。

## 属性引用与普通 ref 的区别

```js
import { reactive, ref, toRef, toRefs } from 'vue';

const state = reactive({ count: 0, name: 'Alice' });
const snapshot = ref(state.count);
const count = toRef(state, 'count');
const { name } = toRefs(state);

count.value = 1;
console.log(state.count); // 1
state.count = 2;
console.log(count.value, snapshot.value); // 2 0
name.value = 'Bob';
console.log(state.name); // 'Bob'
```

`ref(state.count)` 保存当前数字；`toRef(state, 'count')` 的读写关联到该属性。

`toRefs()` 返回普通对象（数组输入则返回数组），其中每项是属性 ref；只处理调用时可枚举的属性，不会自动为后来新增的属性创建 ref。可能尚不存在的属性用 `toRef(state, 'optional')`。

## props 与 getter

```js
const title = toRef(props, 'title');
```

这样保留 prop 更新，但不会获得修改 prop 的权限。需要双向绑定时使用更新事件或 `defineModel()`。

Vue 3.3+ 的单参数 `toRef()` 还能归一化输入：已有 ref 原样返回，普通值包装为 ref，getter 转为只读 ref。

```js
const title = toRef(() => props.title);
```

直接解构 `reactive` 的基本类型属性会得到快照。Vue 3.5+ 对 `<script setup>` 内 `defineProps()` 的响应式解构有编译支持，具体边界见 [setup](003-setup.md)。

## 组合函数的返回方式

```js
function useUser() {
  const state = reactive({ name: 'Alice', age: 25 });
  return toRefs(state);
}

const { name, age } = useUser();
```

若状态本来就是单独的 ref，直接返回 `{ name, age }` 即可，无需再次调用 `toRefs()`。

`toRef()` 和 `toRefs()` 是 Vue 3 提供的两个**响应式工具函数**，用于在 **Composition API 中安全地解构响应式对象（如 `props` 或 `reactive` 对象）**，同时**保持响应性**。

---

## 核心问题：为什么需要它们？

当你从一个 `reactive` 对象（比如 `props`）中直接解构属性时，**会丢失响应性**：

```js
import { reactive } from 'vue';

const state = reactive({ count: 0 });

// 错误：count 是普通 number，不再是响应式的！
const { count } = state;

setTimeout(() => {
  state.count = 10; // 修改源对象
  console.log(count); // 仍然是 0！
}, 1000);
```

这是因为解构赋值本质上是 **“读取当前值”**，得到的是原始值的拷贝，而不是对响应式数据的引用。

---

## 一、`toRef()` —— 创建单个属性的响应式引用

```js
toRef(reactiveObject, 'propertyName')
```

- 返回一个 **ref 对象**，其 `.value` 指向 `reactiveObject.propertyName`
- 修改 `ref.value` 会同步更新原对象，反之亦然
- 即使原对象没有该属性，也会创建一个“链接”

示例：

```js
import { reactive, toRef } from 'vue';

const state = reactive({ count: 0 });

// 创建 count 的 ref 引用
const countRef = toRef(state, 'count');

console.log(countRef.value); // 0

// 修改 ref
countRef.value = 5;
console.log(state.count); // 5 ✅ 同步更新！

// 修改原对象
state.count = 10;
console.log(countRef.value); // 10 ✅ 也同步！
```

### 典型用途：安全解构 `props`

```js
export default {
  props: ['title', 'user'],
  setup(props) {
    // ❌ 失去响应性
    // const { user } = props;

    // ✅ 保持响应性
    const user = toRef(props, 'user');

    return { user };
  }
};
```

---

## 二、`toRefs()` —— 批量创建所有属性的响应式引用

**✅ toRefs() 返回的对象本身不是响应式的，但它里面的每一个属性都是 ref，而这些 ref 是响应式的。**

1. toRefs(obj) 的返回值是一个普通 JavaScript 对象
2. toRefs(obj) 的返回值**每个属性都是 ref**

```js
toRefs(reactiveObject)
```

- 将 `reactiveObject` 的**每个属性**都转换为 `ref`
- 返回一个**普通对象**，结构与原对象相同，但每个值都是 `ref`

示例：

```js
import { reactive, toRefs } from 'vue';

const state = reactive({
  name: 'Alice',
  age: 25
});

// 转换所有属性为 ref
const refs = toRefs(state);

console.log(refs.name.value); // 'Alice'
console.log(refs.age.value);  // 25

// 解构（现在安全了！）
const { name, age } = toRefs(state);

// 修改
name.value = 'Bob';
console.log(state.name); // 'Bob' ✅

state.age = 30;
console.log(age.value); // 30 ✅
```

### 典型用途：在 `setup` 中返回响应式状态

```js
import { reactive, toRefs } from 'vue';

function useUser() {
  const state = reactive({
    name: 'John',
    email: 'john@example.com'
  });

  // 返回解构后的 ref，保持响应性
  return toRefs(state);
}

export default {
  setup() {
    const { name, email } = useUser(); // ✅ 响应式！
    return { name, email };
  }
};
```

> 这是 Composition API 中非常常见的模式！

---

## 三、对比总结

| 特性 | `toRef` | `toRefs` |
|------|--------|---------|
| **作用范围** | 单个属性 | 所有可枚举属性 |
| **返回值** | 一个 `ref` | 一个对象，每个属性是 `ref` |
| **使用场景** | 解构 `props` 中某个 prop或需要单个属性的 ref | 将整个 `reactive` 对象转为 refs便于解构返回 |
| **性能** | 轻量 | 遍历所有属性，稍重（但通常可忽略） |
| **处理不存在的属性** | 会创建一个“空链接”（值为 `undefined`） | 只处理对象上**已存在的属性** |

---

## 四、常见误区

误区1：`toRefs` 会让新添加的属性变成响应式？

```js
const state = reactive({ a: 1 });
const refs = toRefs(state);
state.b = 2; // 添加新属性

// refs.b 是 undefined！toRefs 不会监听新增属性
```
> ✅ `toRefs` 只在调用时转换**当前存在的属性**。

误区2：`toRef` 和 `ref` 一样？

```js
const obj = reactive({ x: 1 });
const r1 = ref(obj.x);     // 创建独立的 ref，值为 1
const r2 = toRef(obj, 'x'); // 创建指向 obj.x 的 ref

obj.x = 2;
console.log(r1.value); // 1 ❌ 不变
console.log(r2.value); // 2 ✅ 同步
```

---

## 五、最佳实践建议

1. **解构 `props` 时，用 `toRef` 或 `toRefs`**
   ```js
   const { title } = toRefs(props);
   ```

2. **在组合函数（composables）中返回状态时，用 `toRefs`**
   ```js
   function useMouse() {
     const x = ref(0), y = ref(0);
     // ...逻辑
     return { x, y }; // 已是 ref，无需 toRefs
   }

   function useStore() {
     const state = reactive({ count: 0, name: '' });
     return toRefs(state); // 转为 refs 再返回
   }
   ```

3. **不需要解构时，直接使用 `reactive` 对象更简洁**

---

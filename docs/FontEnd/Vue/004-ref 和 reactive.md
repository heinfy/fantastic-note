`ref()`、`reactive()` 和 `computed()` 是 Vue 3 **响应式系统**的三大核心 API，它们都用于创建“响应式数据”。

---

## 一、本质区别

| 函数 | 本质 | 用途 |
|------|------|------|
| `ref()` | 创建一个**可变的响应式引用对象（Ref）**，包装**基本类型或对象** | 适用于所有类型，尤其基本类型（number/string/boolean） |
| `reactive()` | 创建一个**响应式的代理对象（Proxy）**，仅适用于**对象/数组** | 适用于复杂对象、嵌套结构 |
| `computed()` | 创建一个**只读的响应式派生值（ComputedRef）**，基于其他响应式数据**计算得出** | 适用于依赖其他数据的“派生状态” |

## 二、ref 和 reactive

`ref()` 创建的 **响应式引用对象（Ref）** 和 `reactive()` 创建的 **响应式代理对象（Proxy）**，虽然最终都实现了“响应式”，但它们在 **底层实现机制、数据结构、访问方式、适用场景** 上有本质区别。

| 特性 | `ref()` → Ref 对象 | `reactive()` → Proxy 对象 |
|------|------------------|------------------------|
| **设计目的** | 包装**任意类型**（包括基本类型）使其具有 `.value` 响应式能力 | 对**对象/数组**进行深度代理，使其属性访问/修改可追踪 |
| **能否包装 number/string** | ✅ 可以 | ❌ 不行（会警告或无效） |
| **访问方式** | 必须通过 `.value`（JS 中） | 直接访问属性（如 `obj.a`） |
| **底层技术** | `class RefImpl` | ES6 `Proxy` + `Reflect` |
| **模板中是否自动解包** | ✅ 是 | ✅ 是（但本身无需解包） |

### 1. `ref()` 的底层：**RefImpl 类（本质是带 getter/setter 的对象）**

在 Vue 源码中，`ref(value)` 返回的是一个 `RefImpl` 实例：

```ts
// 简化版 RefImpl
class RefImpl<T> {
  private _value: T;
  public dep?: Dep; // 依赖收集容器

  constructor(value: T) {
    this._value = value;
  }

  get value() {
    track(this, 'get', 'value'); // 收集依赖
    return this._value;
  }

  set value(newVal: T) {
    this._value = newVal;
    trigger(this, 'set', 'value'); // 触发更新
  }
}
```

关键点：
- **`.value` 是一个 getter/setter**
- 当你读 `ref.value` → 触发 `track()`（收集当前 effect）
- 当你写 `ref.value = x` → 触发 `trigger()`（通知依赖更新）
- **即使包装的是对象**，`ref({ a: 1 })` 的 `.value` 也会被 `reactive()` 自动包裹（深度响应式）

> 🔍 所以 `ref` 本质是一个“**响应式盒子**”，无论装什么，都通过 `.value` 进出。

---

### 2. `reactive()` 的底层：**Proxy 代理整个对象**

`reactive(target)` 使用 `Proxy` 拦截对象的所有操作：

```ts
// 简化版 reactive
function reactive(target) {
  if (!isObject(target)) return target;

  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      track(target, 'get', key); // 收集依赖（按 key）
      return isObject(res) ? reactive(res) : res; // 递归代理嵌套对象
    },

    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, 'set', key); // 触发更新（按 key）
      return result;
    },

    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, 'delete', key);
      return result;
    }
  });

  return proxy;
}
```

关键点：
- **拦截的是对象的属性访问（`obj.key`）**
- 每个 **`key` 独立收集依赖**（`dep` 按 `target + key` 存储）
- **深度代理**：访问嵌套对象时自动递归调用 `reactive`
- **不能代理基本类型**（因为 Proxy 只能代理 object）

> 🔍 所以 `reactive` 本质是一个“**透明的响应式镜子**”，你操作原对象的方式完全不变。

---

### 3. 依赖收集粒度不同

这是最核心的区别之一：

| 方式 | 依赖收集粒度 | 示例 |
|------|------------|------|
| `ref` | **整个 ref 对象** | 修改 `count.value` 会触发所有依赖 `count` 的地方 |
| `reactive` | **按属性（key）** | 修改 `state.a` 只触发依赖 `state.a` 的地方，不影响 `state.b` |

### 4. 本质区别一览

| 维度 | `ref()` | `reactive()` |
|------|--------|-------------|
| **底层技术** | `class` + getter/setter | ES6 `Proxy` |
| **数据结构** | `{ value: T }` 对象 | Proxy 代理的原对象 |
| **访问方式** | 必须 `.value`（JS 中） | 直接 `obj.key` |
| **支持类型** | 任意类型（基本类型 + 对象） | 仅对象/数组 |
| **依赖粒度** | 整个 ref | 按属性（key） |
| **模板行为** | 自动解包 `.value` | 无需解包 |
| **设计哲学** | “包装器”模式 | “透明代理”模式 |

## `ref()` 实现对象的响应式


答案是：**`ref` 在内部对对象类型自动调用了 `reactive()`！**

```js
const objRef = ref({ count: 0 });
```

Vue 并不会简单地把 `{ count: 0 }` 存到 `_value` 里就完事，而是会**递归地将其转换为响应式对象**。

### 1. 源码逻辑（Vue 3 `ref.ts`）：

```ts
function ref(value) {
  return createRef(value, false);
}

function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue;
  }

  // 👇 关键：如果值是对象 且 不是 shallow ref，则用 reactive 包装
  const value = shallow || !isObject(rawValue) 
    ? rawValue 
    : reactive(rawValue);

  return new RefImpl(value, shallow);
}
```

> ✅ 所以：  
> ```js
> ref({ a: 1 })  // 等价于 ref(reactive({ a: 1 }))
> ```

这意味着：
- `objRef.value` 返回的是一个 **`reactive` 代理对象**
- 对 `objRef.value.count` 的读写，实际上是通过 `Proxy` 实现的响应式
- 嵌套属性也会自动响应式（深度代理）

---

### 2. 验证

实验 1：`ref({})` 内部是 `reactive` 对象

```js
import { ref, isReactive } from 'vue';

const objRef = ref({ count: 0 });

console.log(isReactive(objRef.value)); // ✅ true
```

实验 2：修改嵌套属性能触发响应式

```js
const state = ref({
  user: {
    name: 'Alice'
  }
});

// 在 effect 或组件中监听
watchEffect(() => {
  console.log('Name:', state.value.user.name);
});

state.value.user.name = 'Bob'; // ✅ 触发更新！
```

实验 3：替换整个 `.value` 会重建响应式

```js
state.value = { user: { name: 'Charlie' } };
// 新对象会被 reactive() 重新包装，依然响应式
```

---

### 3. 与 `shallowRef` 的对比

`shallowRef` **不会**对对象进行 `reactive` 包装：

```js
import { ref, shallowRef, isReactive } from 'vue';

const deep = ref({ a: { b: 1 } });
const shallow = shallowRef({ a: { b: 1 } });

console.log(isReactive(deep.value));       // ✅ true
console.log(isReactive(shallow.value));    // ❌ false

// 修改深层属性
deep.value.a.b = 2;        // ✅ 触发响应式
shallow.value.a.b = 2;     // ❌ 不触发！
```

> 💡 `shallowRef` 适用于：
> - 大型对象（避免深度代理性能开销）
> - 你只关心 `.value` 整体替换（如存储 DOM 元素、第三方库实例）

总结：**`ref` 对对象的响应式支持，本质上是“委托给 `reactive`”来实现的。**

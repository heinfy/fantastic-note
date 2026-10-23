---
sidebar_position: 8
---

# readonly 与 shallowReadonly

`readonly()` 为数据创建深层只读视图；`shallowReadonly()` 只限制根属性的写入。它们不复制数据，也不等同于冻结快照。

## 只读视图保留源数据的更新

```js
import { reactive, readonly, watchEffect } from 'vue';

const source = reactive({ count: 0, user: { name: 'Alice' } });
const view = readonly(source);

watchEffect(() => console.log(view.count));
source.count = 1; // 通过源代理修改，依赖会更新。
view.count = 2; // 写入被阻止；开发环境会警告。
view.user.name = 'Bob'; // 深层写入也被阻止。
```

`readonly(reactiveObject)` 可通过底层响应式代理追踪更新；`readonly(plainObject)` 不会把通过原始普通对象发生的修改变为可追踪事件。

```js
const raw = { count: 0 };
const view = readonly(raw);
watchEffect(() => console.log(view.count));
raw.count = 1; // 数据已改变，但该直接写入不会通知副作用。
```

## shallowReadonly 的边界

```js
import { shallowReadonly } from 'vue';

const config = shallowReadonly({ theme: 'dark', options: { debug: true } });
config.theme = 'light'; // 被阻止。
config.options.debug = false; // 允许，嵌套普通对象保持原样。
```

浅层只读不主动转换嵌套对象。若嵌套值本来是响应式或只读代理，其原有行为仍然保留。

## 用途与判断

适合对外提供状态读取接口，并由拥有者提供修改方法，例如 `provide('count', readonly(count))`。

`isReadonly()` 判断只读性，`isReactive()` 判断响应式代理来源，两者并不互斥；`readonly(reactive({}))` 的两项判断都为 `true`。详见 [响应式类型判断](010-isProxy、isReactive%20和%20isReadonly.md)。浅层状态管理见 [shallowReactive](013-shallowReactive%20和%20shallowReadonly.md)。

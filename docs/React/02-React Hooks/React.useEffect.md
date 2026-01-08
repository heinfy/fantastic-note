# React.useEffect

## 用法

`useEffect` 是 React 提供的一个钩子函数，用于在函数组件中执行副作用操作（side effects），比如访问 DOM、订阅数据、发起网络请求等。useEffect 接受两个参数：一个是副作用函数，另一个是依赖数组。

```js
useEffect(() => {
  // 副作用函数
}, [依赖数组]);
```

- **副作用函数**： 第一个参数是一个函数，用于执行副作用操作。这个函数会在组件渲染完成后立即执行，并且在每次组件重新渲染时都会执行。在这个函数中，可以执行一些具有副作用的操作，比如访问 DOM、订阅数据、发起网络请求等。
- **依赖数组**： 第二个参数是一个数组，用于指定影响副作用函数执行的依赖项。当依赖数组中的某个值发生变化时，副作用函数会被重新执行；

  - 如果依赖数组为空数组 []，则副作用函数只会在组件挂载时执行一次（相当于 componentDidMount），不会有其他触发条件；
  - 如果依赖数组为数组 `[a, b]`，则副作用函数只会 a,b（a b 为 useState 返回值） 改变时执行一次；
  - 如果依赖数组为数组 `[c]`（c 不是 useState 返回值），那么组件状态改变是都会执行一次；
  - 如果省略第二个参数，则副作用函数会在每次组件重新渲染时都被执行。

- useEffect 副作用函数返回一个清理函数，用于清理副作用。当**组件卸载时，或者在下一次执行副作用函数之前执行清理操作**。

## 示例

```jsx
import { useEffect, useState } from "react";

export default function App() {
  const [name, setName] = useState("");
  const [id, setId] = useState(1);

  useEffect(() => {
    console.log(1);
    return () => {
      console.log(2);
    };
  }, [name]);

  useEffect(() => {
    console.log(3);
    return () => {
      console.log(4);
    };
  }, [name, id]);

  return (
    <div>
      <button onClick={(x) => setName("dfasdf")}>new name</button>
    </div>
  );
}
```

```bash
# 首次挂载
# 两个 useEffect 都会在 mount 后执行
# 因为依赖数组不是空的，但这是首次渲染，React 会执行所有 effect。
1
3

# 点击按钮后，react 重新渲染组件
# 清理上一次渲染中依赖发生变化的 effect 的 cleanup 函数
2
4
# 执行新的 effect
1
3
```

---

```jsx
const [count, setCount] = useState(1);
let arr = [4, 5];
/* arr 是一个普通对象，组件初始化或者组件状态更新时， arr 都是重新赋值，
    所以组件初始化或者组件状态更新时， useEffect 每次都会执行*/
useEffect(() => {
  setTimeout(() => {
    setCount(count + 1);
  }, 1000);
  console.log('这是第' + count + '执行');
}, [arr]);
```

---

```jsx
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(1);
  return (
    <div>
      <button onClick={() => {
        setCount(count + 1);  // (1)
        setTimeout(() => { // (2) ← 注意：因为 函数闭包， 这里读的是“旧”的 count
          setCount(count + 1); // (3) ← 这里用的也是“旧”的 count
        }, 1000);
      }}>{count}</button>
    </div>
  );
}
```
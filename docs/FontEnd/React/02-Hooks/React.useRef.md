### ref 是什么

在 React 中，ref 是用来访问组件实例或 DOM 元素的方式。它可以用于访问组件的方法或属性，以及直接操作 DOM 元素。

- **访问 DOM 元素**：通过 ref 可以获取到渲染后的 DOM 元素，然后可以对其进行操作，比如改变样式、添加事件监听器等。
- **访问子组件的方法**：通过 ref 可以访问子组件中暴露的方法或属性（`forwardRef` 和 `useImperativeHandle`）。


### 何时使用 useRef

测试代码：

```jsx
import React, { useState } from 'react';

const App = () => {
  const [count, setCount] = useState(1);
  const showAlert = () => {
    setTimeout(() => {
      alert(count);
    }, 3000);
  };
  return (
    <>
      <div>当前索引： {count}</div>
      <button onClick={() => setCount(count + 1)}>点击 + 1</button>
      <button onClick={showAlert}>3s后展示alert</button>
    </>
  );
};
```

场景复现：
1. 初始 `count = 1`
2. 点击 **+1 按钮** → `count = 2`
3. 再点一次 → `count = 3`
4. 然后点击 **“3s后展示alert”**
5. **3 秒后弹出 `alert(1)` 或 `alert(2)`？**

✅ 实际结果：**弹出的是点击 “alert” 按钮那一刻的 `count` 值**，而不是 3 秒后最新的值。

为什么会这样？

这是因为 **`setTimeout` 中的回调函数形成了闭包**，它**捕获了调用 `showAlert` 时的 `count` 值**（即当时的快照），而不是实时读取最新的 state。

```js
const showAlert = () => {
  // 此时 count = 2（假设）
  setTimeout(() => {
    alert(count); // 这个 count 是闭包捕获的 "2"，不是最新的 state！
  }, 3000);
};
```

React 的 `useState` 返回的 `count` 是**不可变的快照**，每次 re-render 都会生成新的 `count` 和新的 `showAlert` 函数。但 `setTimeout` 里的函数只“记得”它创建时的那个 `count`。

#### 如何让点击的时候弹出实时的 count？

```jsx
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [count, setCount] = useState(1);
  const countUseRef = useRef(count);
  // 主要是通过 useEffect 每次更新重新给 current 赋值
  // `useRef` 的 `.current` 是可变的，且不会触发 re-render，适合存储“最新值”。
  // 在 alert 中也会同时被修改. 这样子, 点击的时候就可以弹出实时的 count 了.
  useEffect(() => {
    console.log('useEffect 执行了');
    countUseRef.current = count;
  });
  const showAlert = () => {
    setTimeout(() => {
      alert(countUseRef.current);
    }, 3000);
  };
  return (
    <>
      <div>当前索引： {count}</div>
      <button onClick={() => setCount(count + 1)}>点击 + 1</button>
      <button onClick={showAlert}>3s后展示alert</button>
    </>
  );
};
export default App;
```

#### 获取上一次的索引

```jsx
import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [count, setCount] = useState(1);
  const preCountUseef = useRef(count);
  // 主要是通过 useEffect 每次更新重新给 current 赋值
  useEffect(() => {
    console.log('useEffect 执行了');
    preCountUseef.current = count;
  });
  console.log('这个先执行！');
  return (
    <>
      <div>上一个索引： {preCountUseef.current}</div>
      <div>当前索引： {count}</div>
      <button onClick={() => setCount(count + 1)}>点击 + 1</button>
    </>
  );
};
export default App;
```

原因： hooks 组件在更新时，先更新 UI，后执行副作用！

### createRef 与 useRef 的区别

官网的定义如下:

useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component

> 换句人话说 , useRef 在 react hook 中的作用, 正如官网说的, 它像一个变量, 类似于 this , 它就像一个盒子, 你可以存放任何东西. createRef 每次渲染都会返回一个新的引用，而 useRef 每次都会返回相同的引用。

```jsx
import React, { createRef, useRef, useState } from 'react';

const App = () => {
  const [renderIdx, setRenderIdx] = useState(1);
  const refFormUseRef = useRef();
  const refFormCreateRef = createRef();
  if (!refFormUseRef.current) {
    refFormUseRef.current = renderIdx;
  }
  if (!refFormCreateRef.current) {
    refFormCreateRef.current = renderIdx;
  }
  return (
    <>
      <div>当前索引： {renderIdx}</div>
      <div>
        <b>refFormUseRef</b> value: {refFormUseRef.current}
      </div>
      <div>
        <b>refFormCreateRef</b> value: {refFormCreateRef.current}
      </div>
      <button onClick={() => setRenderIdx(renderIdx + 1)}>re-render</button>
    </>
  );
};
```

总结：每次 hooks 渲染时， createRef 都会重新创建并被赋值， useRef 和 useState 是保存在 hooks 组件内部的变量，不会在组件重新渲染时再次创建。

区别：

- useRef 仅能用在 FunctionComponent，createRef 仅能用在 ClassComponent。
- createRef 并没有 Hooks 的效果，其值会随着 FunctionComponent 重复执行而不断被初始化：

```js
function App() {
  // 错误用法，永远也拿不到 ref
  const valueRef = React.createRef();
  return <div ref={valueRef} />;
}
```

上述 valueRef 会随着 App 函数的 Render 而重复初始化，这也是 Hooks 的独特之处，虽然用在普通函数中，但在 React 引擎中会得到超出普通函数的表现，比如初始化仅执行一次，或者引用不变。


### 总结

useRef 不仅仅是用来管理 DOM ref 的，它还相当于 this , 可以存放任何变量.

useRef 可以很好的解决闭包带来的不方便性.你可以在各种库中看到它的身影, 比如 react-use 中的 useInterval , usePrevious ……

值得注意的是，当 useRef 的内容发生变化时,它不会通知您。更改.current 属性不会导致重新呈现。因为他一直是一个引用 .

### 链接

- [你不知道的 useRef](https://zhuanlan.zhihu.com/p/105276393)
- [React.useRef and React.createRef: The Difference](https://blog.bitsrc.io/react-useref-and-react-createref-the-difference-afedb9877d0f)

## 函数组件为什么没有实例？

在 React 中，函数组件是没有实例的。这与类组件不同，类组件实例是通过 `new` 关键字创建的，而函数组件只是一个函数。当函数组件被调用时，它会返回一个 React 元素（`virtual DOM`）的描述。React 使用这个描述来构建真实的 DOM，并且在需要时进行更新。

尽管函数组件没有实例，但是你可以使用 `useRef、useEffect、useState` 等 React 钩子来在函数组件中管理状态、引用 DOM 元素等。

## React 生命周期？

![React 生命周期](assets/lifecycle.png)

## super()和 super(props)有什么区别？

super 是为了继承 React.Component 的 this；super(props) 的目的是为了在 constructor 中使用 this.props。props 可以不传，默认的 props 值是在 component.defaultProps 中定义的。

- 参看： [为什么我们要写 super(props) ？](https://overreacted.io/zh-hans/why-do-we-write-super-props/)

## React 事件绑定

---

### 1. **在 JSX 中直接绑定（最常见）**

```jsx
function MyButton() {
  return <button onClick={() => console.log('Clicked!')}>Click</button>;
}
```

---

### 2. **绑定类组件的方法（需处理 this）**

#### (1) 构造函数中绑定（推荐）

```jsx
class MyButton extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this); // 绑定 this
  }
  handleClick() {
    console.log(this.props); // this 正确指向组件实例
  }
  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

#### (2) 箭头函数定义方法（自动绑定 this）

```jsx
class MyButton extends React.Component {
  handleClick = () => {
    // 箭头函数，this 自动绑定
    console.log(this.props);
  };
  render() {
    return <button onClick={this.handleClick}>Click</button>;
  }
}
```

#### (3) 渲染时用箭头函数（不推荐）

```jsx
// ❌ 每次渲染都创建新函数，可能导致子组件不必要重渲染
render() {
  return <button onClick={() => this.handleClick()}>Click</button>;
}
```

---

### 3. **函数组件：直接使用函数**

```jsx
function MyButton({ message }) {
  const handleClick = () => {
    console.log(message);
  };
  // 配合 `useCallback` 优化性能（避免子组件重渲染）
  // const handleClick = useCallback(() => {
  //   console.log(message);
  // }, [message]);
  return <button onClick={handleClick}>Click</button>;
}
```

---

### 4. **传递参数的方式**

#### (1) 箭头函数（常用）

```jsx
<button onClick={() => deleteItem(id)}>Delete</button>
```

#### (2) `bind`（类组件中）

```jsx
// 在构造函数中预绑定
this.handleDelete = this.handleDelete.bind(this, id);

// 或在 JSX 中（不推荐，每次渲染创建新函数）
<button onClick={this.handleDelete.bind(this, id)}>Delete</button>;
```

## React 为什么要绑定 this？

在 React 的**类组件（Class Component）**中，需要手动绑定 `this`，根本原因在于 **JavaScript 中 `this` 的动态绑定机制**，以及 **React 如何调用事件处理函数**。

1. JavaScript 中 `this` 的规则

- 当一个方法通过 **对象方法调用** 时，`this` 指向该对象：
  ```js
  obj.method(); // this === obj
  ```
- 但当函数被**单独引用并调用**（即“脱离对象”），`this` 就会丢失上下文：
  ```js
  const fn = obj.method;
  fn(); // this === undefined（严格模式下）
  ```

2. React 内部如何调用事件处理器？

```jsx
<button onClick={this.handleClick}>
```

实际上，React 只是把 `handleClick` 函数**作为一个普通函数引用**保存起来。  
当事件触发时，React 内部大致这样调用它：

```js
const handler = this.props.onClick;
handler(); // ← 这里是“脱离对象”的调用！
```

此时 `handleClick` 已经和 `Button` 实例**断开联系**，所以 `this` 不再指向组件实例，而是 `undefined`（因为 React 启用了严格模式）。

| 问题根源                                                                                   | 解决方案                                                                                                   |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| JavaScript 中 `this` 是动态的，事件处理<br />器被 React 作为普通函数调用，导致 `this` 丢失 | 1. 构造函数中 `.bind(this)`<br />2. **使用箭头函数定义方法（推荐）**<br />3. 避免在 JSX 中使用内联箭头函数 |

## React 中的 key 有什么作用？

React 中的 key 是帮助 React 识别列表中每个元素的唯一标识，主要作用是：

1. 高效更新列表（Diff 优化）
  - 当列表变化时（增删改），React 通过 key 判断哪些元素是新增、删除或移动的。
  - 避免“逐个对比”，提升渲染性能。

2. 保持组件状态稳定
  - 如果没有 key 或用索引作 key，列表顺序变化时，React 可能复用错误的组件实例，导致状态错乱（如输入框内容错位）。

## 说说对 React 中类组件和函数组件的理解？有什么区别？

类组件中的 showMessage 方法：

```jsx
class ProfilePage extends React.Component {
  showMessage = () => {
    alert('Followed ' + this.props.user);  };
```

这个类方法从 this.props.user 中读取数据。在 React 中 Props 是不可变(immutable)的，所以他们永远不会改变。**然而，this 是，而且永远是，可变(mutable)的。** **函数式组件捕获了渲染所使用的值。** 参看：

- [pjqnl16lm7 - CodeSandbox](https://codesandbox.io/s/pjqnl16lm7)
- [函数式组件与类组件有何不同？](https://overreacted.io/zh-hans/how-are-function-components-different-from-classes/)

## React 如何区分 Class 和 Function？

- [React 如何区分 Class 和 Function？](https://overreacted.io/zh-hans/how-does-react-tell-a-class-from-a-function/)

检查一个组件是否是类组件：`MyComponent.prototype instanceof React.Component`

```jsx
import { Component } from 'react';

function App() {
  return (
    <>
      <Demo1></Demo1>
      <Demo2></Demo2>
    </>
  );
}

class Demo1 extends Component {
  render() {
    return <h3>DEMO1</h3>;
  }
}
function Demo2() {
  return <h3>DEMO2</h3>;
}

// console.log('Component.prototype', Component.prototype);
// console.log('Demo1.prototype', Demo1.prototype);
// console.log('Demo2.prototype', Demo2.prototype);
// console.log('Demo1.prototype', Demo1.prototype instanceof Component);
// console.log('Demo2.prototype', Demo2.prototype instanceof Component);
console.log('Demo1.prototype', Demo1.prototype.isReactComponent); // {}
console.log('Demo2.prototype', Demo2.prototype.isReactComponent); // undefined

export default App;
```

## 在 react 中组件间过渡动画如何实现？

在 react 中实现过渡动画效果会有很多种选择，如 `react-transition-group`，`react-motion`，`Animated`，以及原生的 CSS 都能完成切换动画。参看： [面试官：在 react 中组件间过渡动画如何实现](https://github.com/febobo/web-interview/issues/197)

# React.useReducer

`useReducer` 是 React 提供的一个 Hook，用于**管理复杂的状态逻辑**。

## 基本语法

```js
const [state, dispatch] = useReducer(reducer, initialState);
```

使用 `useReducer` 还能给那些会触发深更新的组件做性能优化，因为可以**向子组件传递 dispatch 而不是回调函数。**

- `reducer`: 一个纯函数 `(state, action) => newState`
- `dispatch`: 用于发送 action 的函数
- `state`: 当前状态

---

## 使用

```tsx
import { useReducer } from 'react';

// 定义 reducer
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return [...state, action.payload];
    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload);
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, []);

  const addItem = () => {
    dispatch({ type: 'ADD_ITEM', payload: { id: Date.now(), name: 'Item' } });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  return (
    <div>
      <h3>Cart ({cart.length} items)</h3>
      <button onClick={addItem}>Add Item</button>
      <button onClick={() => dispatch({ type: 'CLEAR_CART' })}>Clear</button>
      <ul>
        {cart.map(item => (
          <li key={item.id}>
            {item.name}
            <button onClick={() => removeItem(item.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ShoppingCart;
```

---

## 什么时候 **不会** 触发 `useEffect`

reducer 返回**相同的引用**
```js
function reducer(state, action) {
  if (action.type === 'no_change') {
    return state; // ← 返回原对象（引用不变）
  }
  // ...
}
```
→ 即使调用了 `dispatch`，但 `state` 引用未变 → **React 认为状态没变** → 不 re-render → `useEffect` 不触发。

## 总结

| 问题 | 答案 |
|------|------|
| `useReducer` 会触发 `useEffect` 吗？ | ✅ **会**，只要状态变化且在依赖中 |
| 触发机制和 `useState` 一样吗？ | ✅ **完全一样** |
| 如何避免不必要的触发？ | reducer 中**返回原 state 引用**（当状态未变时） |
| `useEffect` 何时执行？ | 组件 re-render 之后（异步） |

> 💡 **记住**：  
> React 只关心 **“状态是否变化”**，而不关心状态是来自 `useState`、`useReducer` 还是其他自定义 Hook。  
> 只要状态变了，依赖它的 `useEffect` 就会运行 —— 这是 React 响应式模型的核心。

--- 
# React.useContext

## 介绍

`useContext` 是 React 中一个非常重要的内置 Hook，用于**在组件树中共享数据**，避免“prop drilling”（即 props 一层层手动传递）的问题。

> - **类组件只能通过 Consumer 接受数据**
> - **函数组件能通过 Consumer 和 useContext 接受数据**

1. 通过 `React.createContext()` 创建上下文；
2. 通过 `<Privider value={value}>` 包裹组件'；
3. 通过 `useContext()` 使用上下文的值。

## 核心概念

### 1. **Context 对象**
通过 `React.createContext(defaultValue)` 创建：
```js
const MyContext = React.createContext(defaultValue);
```

### 2. **Provider（提供者）**
用 `<MyContext.Provider value={...}>` 包裹子树，提供共享值：
```jsx
<MyContext.Provider value="dark">
  <Child />
</MyContext.Provider>
```

### 3. **Consumer（消费者）**
在函数组件中，使用 `useContext(MyContext)` 读取值：
```js
const value = useContext(MyContext);
```

> ⚠️ 注意：`useContext` 必须在 `Provider` 的子组件中调用，否则返回 `defaultValue`。

---

## 基本使用 Demo

```jsx
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();
const { Provider, Consumer } = ThemeContext;

export default class Parent extends React.Component {
  render() {
    return (
      <Provider value={'green'}>
        <h1>Parent</h1>
        <Son />
      </Provider>
    );
  }
}

class Son extends React.Component {
  render() {
    return (
      <>
        <h2>Son</h2>
        <GrandSon1 />
        <GrandSon2 />
        <GrandSon3 />
      </>
    );
  }
}

class GrandSon1 extends React.Component {
  render() {
    return (
      <>
        <h3>GrandSon1</h3>
        <Consumer>{data => <span>呼伦贝尔的颜色是{data}</span>}</Consumer>
      </>
    );
  }
}

const GrandSon2 = () => {
  let theme = useContext(ThemeContext);
  return (
    <>
      <h3>GrandSon2</h3>
      <span>呼伦贝尔的颜色是{theme}</span>
    </>
  );
};

const GrandSon3 = () => {
  return (
    <>
      <h3>GrandSon3</h3>
      <Consumer>{data => <span>呼伦贝尔的颜色是{data}</span>}</Consumer>
    </>
  );
};
```

## 配合 `useReducer` 实现全局状态管理

这是 React 官方推荐的**轻量级状态管理方案**（替代 Redux）。

### 🌰 示例：用户登录状态

```jsx
// 1. 创建 Context
const UserContext = createContext();

// 2. Reducer 管理复杂状态
function userReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isLoggedIn: true };
    case 'LOGOUT':
      return { ...state, user: null, isLoggedIn: false };
    default:
      return state;
  }
}

// 3. 自定义 Provider（封装逻辑）
export function UserProvider({ children }) {
  const [userState, dispatch] = useReducer(userReducer, {
    user: null,
    isLoggedIn: false
  });

  return (
    <UserContext.Provider value={{ userState, dispatch }}>
      {children}
    </UserContext.Provider>
  );
}

// 4. 自定义 Hook（最佳实践）
export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}

// 5. 组件中使用
function Profile() {
  const { userState, dispatch } = useUser();

  if (!userState.isLoggedIn) {
    return (
      <button onClick={() => dispatch({ type: 'LOGIN', payload: { name: 'Alice' } })}>
        Login
      </button>
    );
  }

  return <h1>Welcome, {userState.user.name}!</h1>;
}

// 6. App 根组件
function App() {
  return (
    <UserProvider>
      <Profile />
    </UserProvider>
  );
}
```

✅ 优势：
- 全局状态集中管理
- 任意组件可访问/修改状态
- 无需 prop drilling

---

## 总结

| 特性 | 说明 |
|------|------|
| **作用** | 跨组件共享数据，避免 prop drilling |
| **核心 API** | `createContext`, `Provider`, `useContext` |
| **触发更新** | 当 `Provider.value` 引用变化时，所有 Consumer re-render |
| **性能关键** | 拆分 Context、稳定 value 引用、避免高频更新 |
| **最佳搭档** | `useReducer`（实现全局状态管理） |

> 💡 **记住**：  
> `useContext` 不是万能的 —— 它最适合**低频更新、全局共享**的数据。  
> 对于复杂或高频状态，考虑更专业的状态管理库（如 Zustand、Jotai、Redux Toolkit）。

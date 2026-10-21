React 引入 Hooks 的核心目的，是为了解决**类组件**（Class Component）在开发实践中暴露出的三大核心痛点，从而让状态逻辑的复用更简单、让代码逻辑更清晰、并降低学习门槛。

React Hooks 于 2019 年在 React 16.8 版本中正式引入，它允许你在不编写类组件的情况下，使用状态（state）和其他 React 特性。

以下是 React 引入 Hooks 的详细动机和主要目的：

## 1. 解决状态逻辑复用的难题

在 Hooks 出现之前，React 复用状态逻辑主要依赖**高阶组件（HOC）**和 **Render Props**。

- **痛点：** 这些模式虽然能解决问题，但会导致组件层级嵌套过深，形成“嵌套地狱”（Wrapper Hell 或 Nesting Hell）。这不仅让代码难以阅读，还会在 React DevTools 中产生大量无用的中间节点。
- **Hooks 的解决方案：** **自定义 Hook (Custom Hooks)**。
  - 你可以将组件中的状态逻辑提取到一个普通的 JavaScript 函数中（以 `use` 开头）。
  - 这种方式不需要改变组件结构，就能在多个组件间共享逻辑，让组件树保持扁平。

### 场景：获取窗口宽度 (`useWindowWidth`)

> **“在组件挂载时获取窗口宽度，并在窗口大小改变时更新它”**。

在 Hooks 出现之前，如果在多个组件中复用这个逻辑，通常需要使用 **高阶组件 (HOC)** 或 **Render Props**，这会导致严重的“嵌套地狱”。而使用 **自定义 Hook**，我们可以将这段逻辑提取出来，让代码变得极其清爽。

#### ❌ 方案一： render props 模式

假设你有两个组件 `UserProfile` 和 `Dashboard` 都需要知道窗口宽度。

**1. 定义一个 Render Props 组件 (WindowWidthProvider)**

```javascript
// 旧模式：为了复用逻辑，必须包一层组件
class WindowWidthProvider extends React.Component {
  state = { width: window.innerWidth };

  handleResize = () => this.setState({ width: window.innerWidth });

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    // 必须通过 render prop 把数据传下去
    return this.props.children(this.state.width);
  }
}
```

**2. 在业务组件中使用 (嵌套开始...)**

```javascript
// UserProfile 组件
function UserProfile() {
  return (
    <WindowWidthProvider>
      {(
        width // 第一层嵌套
      ) => (
        <div>
          <h1>用户资料</h1>
          {width < 600 ? <MobileLayout /> : <DesktopLayout />}

          {/* 如果还需要复用另一个逻辑，比如鼠标位置，就要再包一层 */}
          <MousePositionProvider>
            {(
              mouse // 第二层嵌套 -> 嵌套地狱！
            ) => <p>鼠标位置: {mouse.x}</p>}
          </MousePositionProvider>
        </div>
      )}
    </WindowWidthProvider>
  );
}
```

**痛点：** 组件结构被逻辑强占（嵌套地狱），缩进层级越来越深，代码难以阅读和维护。

---

#### ❌ 方案二：HOC 模式

1. 定义 HOC (`withWindowWidth`)

这个函数不渲染任何 UI，它只负责“包裹”逻辑。

```javascript
import React, { Component } from 'react';

// HOC 工厂函数
const withWindowWidth = WrappedComponent => {
  // 返回一个新的类组件
  return class extends Component {
    constructor(props) {
      super(props);
      this.state = {
        width: window.innerWidth
      };
      this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
      window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.handleResize);
    }

    handleResize() {
      this.setState({ width: window.innerWidth });
    }

    render() {
      // 关键步骤：将 state 中的 width 作为 prop 注入到被包裹的组件中
      // ...this.props 确保原有 props 也能透传下去
      return (
        <WrappedComponent
          width={this.state.width}
          {...this.props}
        />
      );
    }
  };
};

export default withWindowWidth;
```

2. 定义业务组件 (`UserProfile`)

注意：这个组件**不需要知道**窗口宽度是怎么来的，它只需要假设自己会收到一个名为 `width` 的 prop。

```javascript
import React from 'react';

const UserProfile = ({ width, userName }) => {
  const isMobile = width < 600;

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h2>用户：{userName}</h2>
      <p>当前窗口宽度：{width}px</p>

      {isMobile ? <button>移动端布局</button> : <button>桌面端布局</button>}
    </div>
  );
};

export default UserProfile;
```

3. 使用 HOC 组合组件

在使用时，你需要用 `withWindowWidth` 包裹 `UserProfile`。通常有两种写法：

写法 A：导出时包裹（常见）

```javascript
// UserProfileContainer.js
import UserProfile from './UserProfile';
import withWindowWidth from './withWindowWidth';

// 导出增强后的组件
export default withWindowWidth(UserProfile);
```

_在其他地方使用时：_ `<UserProfileContainer userName="Alice" />` (注意此时组件名通常变了，或者你直接导入默认导出)。

写法 B：使用时包裹（更直观展示 HOC 结构）

```javascript
import React from 'react';
import UserProfile from './UserProfile';
import withWindowWidth from './withWindowWidth';

const App = () => {
  // 动态创建增强组件
  const UserProfileWithWidth = withWindowWidth(UserProfile);

  return (
    <div>
      <h1>应用首页</h1>
      {/* 使用时，width 属性会自动注入，无需手动传递 */}
      <UserProfileWithWidth userName='Alice' />
      <UserProfileWithWidth userName='Bob' />
    </div>
  );
};

export default App;
```

HOC 模式的核心痛点（对比 Hooks）

虽然上面的代码能跑，但你能明显感觉到几个问题，这正是 React 引入 Hooks 的原因：

1.  **嵌套地狱 (Wrapper Hell)**：如果 `UserProfile` 还需要监听鼠标位置 (`withMousePosition`) 和用户登录状态 (`withAuth`)，代码会变成这样：

    ```javascript
    // 层层包裹，缩进极深，难以阅读
    export default withAuth(withMousePosition(withWindowWidth(UserProfile)));
    ```

    而在 Hooks 中，只是简单的三行调用：

    ```javascript
    const width = useWindowWidth();
    const mouse = useMousePosition();
    const user = useAuth();
    ```

2.  **Props 命名冲突**：如果 `withWindowWidth` 注入的 prop 叫 `width`，而父组件手动传了一个也叫 `width` 的 prop，HOC 里的逻辑通常会覆盖掉手动传的 prop（取决于实现），这会导致难以排查的 Bug。Hooks 返回的是变量，由开发者自己命名 (`const myWidth = useWindowWidth()`)，完全避免冲突。

3.  **静态方法丢失**：如果 `UserProfile` 上定义了一些静态方法（如 `UserProfile.someStaticMethod()`），经过 HOC 包裹后，返回的新组件并不包含这些静态方法，需要额外处理（如 `hoist-non-react-statics` 库）才能透传。

4.  **Ref 传递问题**：在旧版 React 中，Ref 无法直接传递给 HOC 生成的内部组件（除非使用 `React.forwardRef`，但这增加了复杂度）。

HOC 通过**“包裹 + 注入 Props”**的方式实现了逻辑复用，但它改变了组件的层级结构，导致了嵌套和 Props 冲突问题。而 Hooks 通过**“函数调用 + 内部状态”**的方式，在不改变组件树结构的前提下，优雅地解决了同样的问题。

#### ✅ 方案三：使用自定义 Hook (逻辑复用)

现在，我们将监听窗口的逻辑提取为一个自定义 Hook。**注意：自定义 Hook 必须以 `use` 开头。**

**1. 创建自定义 Hook (`useWindowWidth.js`)**

```javascript
import { useState, useEffect } from 'react';

// 提取逻辑：这是一个普通的函数，不渲染任何 UI
export function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    // 清理副作用：组件卸载或再次执行前移除监听
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width; // 只返回需要的数据
}
```

**2. 在业务组件中使用 (扁平清晰)**

```javascript
import { useWindowWidth } from './useWindowWidth';
// 假设还有一个 useMousePosition
import { useMousePosition } from './useMousePosition';

function UserProfile() {
  // 直接调用 Hook，像使用变量一样简单
  const width = useWindowWidth();
  const mouse = useMousePosition();

  return (
    <div>
      <h1>用户资料</h1>
      {/* 逻辑直接使用，没有任何嵌套 */}
      {width < 600 ? <MobileLayout /> : <DesktopLayout />}

      <p>鼠标位置: {mouse.x}</p>
    </div>
  );
}

function Dashboard() {
  // 在另一个组件中同样简单地复用
  const width = useWindowWidth();

  return (
    <div>
      <h2>仪表盘</h2>
      <p>当前宽度: {width}</p>
    </div>
  );
}
```

### 核心优势对比

| 特性           | 旧模式 (Render Props / HOC)            | 新模式 (Custom Hooks)                  |
| :------------- | :------------------------------------- | :------------------------------------- |
| **组件树结构** | **深层嵌套**，产生大量无意义的包装节点 | **完全扁平**，组件结构只关注 UI        |
| **代码可读性** | 逻辑分散在外部组件和回调函数中         | 逻辑内聚，直接在组件内部按顺序阅读     |
| **组合能力**   | 多个逻辑组合时，嵌套层级指数级增加     | 多个 Hook 只是简单的函数调用，互不干扰 |
| **类型推导**   | TypeScript 推导往往比较复杂            | 函数返回值，类型推导非常自然           |

这个 Demo 展示了 Hooks 如何解决**状态逻辑复用**的难题：

1.  **提取**：将带有状态 (`useState`) 和副作用 (`useEffect`) 的逻辑提取到独立的函数中。
2.  **调用**：在任何函数组件中直接调用该函数。
3.  **结果**：既实现了代码复用，又保持了组件树的干净和扁平，彻底告别了“嵌套地狱”。

## 2. 解决复杂组件难以维护的问题

随着业务增长，类组件往往变得非常庞大且难以理解。

- **痛点：** 类组件强制我们按照**生命周期**（如 `componentDidMount`, `componentDidUpdate`）来组织代码。这就导致一个组件中相关的逻辑（比如数据获取和数据清理）被拆分到不同的生命周期方法中，而不相关的逻辑却被混在一起。
- **Hooks 的解决方案：** **按逻辑关注点分离**。
  - 使用 `useEffect`，你可以将**相关**的逻辑代码放在一起（例如，将某个数据的获取、更新和清理都写在同一个 `useEffect` 中）。
  - 这打破了生命周期的限制，允许你按照功能而非生命周期来组织代码，大大提升了可读性。

## 3. 降低学习和使用成本

类组件对于开发者（尤其是初学者）存在较高的学习门槛。

- **痛点：**
  - **`this` 指向问题：** JavaScript 的 `this` 机制非常容易让人混淆，开发者经常需要手动绑定事件处理器（`bind`）。
  - **冗余代码：** 类组件代码通常比较冗长，需要继承 `React.Component`，且必须理解类的构造函数等概念。
- **Hooks 的解决方案：** **函数式编程**。
  - 开发者可以更多地使用简洁的函数组件，避免了复杂的 `this` 指向问题。
  - 代码更加简洁、直观，更符合现代 JavaScript 的函数式编程风格。

## 总结对比

为了让你更直观地理解，我为你整理了类组件与 Hooks 的对比：

| 核心痛点     | 类组件 (Class Component) 的表现        | Hooks 的解决方案                        |
| :----------- | :------------------------------------- | :-------------------------------------- |
| **逻辑复用** | 高阶组件/Render Props 导致**嵌套地狱** | 自定义 Hook，**无嵌套层级增加**         |
| **代码组织** | 相关逻辑被**分散**在多个生命周期中     | 相关逻辑**集中**在同一个 Hook 中        |
| **学习门槛** | 需要理解 `this`、类、绑定等复杂概念    | 函数式风格，**无需关心 `this`**，更简洁 |

**总而言之，Hooks 的引入是为了让 React 开发变得更简单、更灵活。** 它不仅解决了旧模式下的代码复用和维护性问题，还为函数组件赋予了与类组件同等的能力，成为了现代 React 开发的主流和推荐方式。

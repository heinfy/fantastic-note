React 性能优化是一个系统性工程，涵盖 **渲染效率、内存管理、加载速度、交互响应** 等多个维度。以下是 React 应用中常用且有效的性能优化手段，按类别组织：

---

### 一、减少不必要的渲染（核心）

#### 1. **使用 `React.memo` 包裹组件**

- 防止函数组件在 props 不变时重新渲染

```jsx
const Button = React.memo(({ label, onClick }) => <button onClick={onClick}>{label}</button>);
```

> ⚠️ 注意：仅当 props 是**浅比较稳定**时有效；避免在 JSX 中直接传入新对象/函数。

---

#### 2. **使用 `useMemo` 缓存计算结果**

- 避免昂贵的计算在每次渲染时重复执行

```jsx
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

#### 3. **使用 `useCallback` 缓存函数引用**

- 防止子组件因父组件函数引用变化而重渲染

```jsx
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

> ✅ 与 `React.memo` 配合使用效果最佳。

---

#### 4. **避免在 render 中创建新对象/函数**

```jsx
<Component style={{ color: 'red' }} /> // 每次都新建对象
<Component onClick={() => {}} />      // 每次都新建函数

const style = { color: ' red' };
const handleClick = useCallback(() => {}, []);
```

---

### 二、优化列表渲染

#### 1. **为列表项提供稳定 `key`**

- 使用**唯一且稳定**的 ID（而非数组索引）

```jsx
{
  items.map(item => (
    <Item
      key={item.id}
      {...item}
    />
  ));
}
```

> ✅ 提升 Diff 效率，避免状态错乱。

#### 2. **虚拟滚动（Virtualization）**

- 对长列表（>100 项）只渲染可视区域

```jsx
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={1000}
  itemSize={35}
>
  {({ index, style }) => <div style={style}>Row {index}</div>}
</List>;
```

---

### 三、代码分割与懒加载

#### 1. **路由级代码分割**

```jsx
const Home = React.lazy(() => import('./pages/Home'));
<Suspense fallback={<Spinner />}>
  <Home />
</Suspense>;
```

#### 2. **组件级懒加载**

- 对非首屏重型组件（如编辑器、图表）延迟加载

#### 3. **预加载（Prefetching）**

- 在用户可能交互前加载资源（hover、scroll 时）

---

### 四、状态管理优化

#### 1. **状态提升要谨慎**

- 避免将状态提升到过高层级，导致大面积重渲染
- 使用 **Context + useReducer** 时，拆分多个 Context 避免“全量更新”

#### 2. **使用 Redux Toolkit 等现代状态库**

- 相比原生 Context，它们提供更细粒度的订阅更新

#### 3. **避免深层嵌套状态**

- 扁平化状态结构，便于 `useMemo` 和选择性更新

---

### 五、服务端与加载性能

#### 1. **启用 SSR / SSG**

- Next.js、Remix 等框架支持服务端渲染，提升首屏速度和 SEO

#### 2. **Suspense + 流式 SSR（React 18+）**

- 先返回核心内容，异步注入非关键部分

#### 3. **资源预加载**

- `<link rel="preload">`、`<link rel="modulepreload">`
- `ReactDOM.preload()`（实验性）

---

### 六、开发与构建优化

#### 1. **生产环境压缩**

- 确保部署的是 minified 版本（Webpack/Vite 默认支持）

#### 2. **启用 React Profiler（开发阶段）**

```jsx
<React.Profiler id="App" onRender={...}>
  <App />
</React.Profiler>
```

- 分析组件渲染次数、耗时

#### 3. **使用 StrictMode 发现副作用**

- 帮助识别不安全的生命周期和非纯函数

---

### 七、高级并发特性（React 18+）

#### 1. **使用 `startTransition` 标记非紧急更新**

```jsx
startTransition(() => {
  setSearchQuery(input); // 不阻塞输入
});
```

- 避免高优交互（如打字）被低优更新（如搜索结果）阻塞

#### 2. **使用 `useDeferredValue` 延迟派生状态**

```jsx
const deferredQuery = useDeferredValue(query);
// query 立即更新，deferredQuery 延迟更新用于渲染
```

#### 3. **利用 Selective Hydration（自动）**

- 用户点击某组件时，优先水合该组件（React 18+ 自动支持）

---

### 八、其他实用技巧

| 技巧                          | 说明                                               |
| ----------------------------- | -------------------------------------------------- |
| **避免内联样式对象**          | 改用 CSS 类或 `styled-components`                  |
| **使用 CSS 动画代替 JS 动画** | 利用 GPU 加速，避免主线程阻塞                      |
| **防抖/节流事件处理器**       | 如 `onScroll`, `onResize`                          |
| **取消过期副作用**            | 在 `useEffect` 中返回 cleanup 函数                 |
| **图片懒加载**                | `<img loading="lazy" />` 或 `IntersectionObserver` |

---

### 九、性能分析工具推荐

- **React DevTools Profiler**：官方性能分析面板
- **Why Did You Render**：检测不必要的重渲染
- **Lighthouse**：评估整体 Web 性能（FCP, TTI, LCP 等）
- **Web Vitals**：监控真实用户性能指标

---

### 总结：React 性能优化原则

> ✅ **核心思想**：  
> **“只在必要时做最少的工作”**

1. **减少渲染次数** → `memo` / `useCallback` / `useMemo`
2. **减少单次渲染工作量** → 虚拟滚动、简化组件
3. **延迟非关键工作** → 代码分割、Transition、Deferred Value
4. **提前准备资源** → 预加载、SSR、缓存
5. **用工具驱动优化** → Profiler + Lighthouse

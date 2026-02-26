**React Router** 是 React 官方推荐的**声明式路由解决方案**，用于在单页应用（SPA）中实现**前端路由**——即根据 URL 动态渲染不同组件，而无需刷新页面。

---

### 一、核心理解

#### 核心思想：**“URL 即状态”**
- 将 URL 路径与 UI 组件绑定
- 用户导航（点击链接、前进/后退） → URL 变化 → 自动匹配并渲染对应组件

#### 工作原理：
1. 监听浏览器 `history` 变化（`pushState` / `popstate`）
2. 根据当前 URL **匹配预定义的路由规则**
3. 渲染匹配到的组件（其他组件卸载）

#### 两种模式：
| 模式 | URL 示例 | 说明 |
|------|--------|------|
| **Browser Router** | `https://site.com/users` | 使用 HTML5 History API，**无 #**，需服务端配合 |
| **Hash Router** | `https://site.com/#/users` | 使用 URL hash（#），**兼容老浏览器**，无需服务端配置 |

---

### 二、常用 Router 组件


#### 1. **`<BrowserRouter>` / `<HashRouter>`**
- **根路由容器**，包裹整个应用
```jsx
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

#### 2. **`<Routes>` + `<Route>`**
- **定义路由映射规则**
- `Routes`：只渲染**第一个匹配的 Route**
- `Route`：声明路径与组件的对应关系

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/users" element={<Users />} />
  <Route path="/users/:id" element={<UserProfile />} />
</Routes>
```

#### 3. **`<Link>` / `<NavLink>`**
- **声明式导航**（替代 `<a href>`，避免页面刷新）
- `NavLink`：支持**激活状态样式**（如高亮当前页）

```jsx
<Link to="/users">用户列表</Link>
<NavLink 
  to="/profile" 
  style={({ isActive }) => ({ color: isActive ? 'red' : 'black' })}
>
  个人中心
</NavLink>
```

#### 4. **`useNavigate()` Hook**
- **编程式导航**（在 JS 中跳转）
```js
const navigate = useNavigate();

// 跳转
navigate('/users');
// 后退
navigate(-1);
// 替换当前历史记录
navigate('/login', { replace: true });
```

#### 5. **`useParams()` Hook**
- 获取动态路由参数（如 `/users/123` 中的 `123`）
```js
// 路由: <Route path="/users/:id" element={<Profile />} />
function Profile() {
  const { id } = useParams(); // { id: "123" }
  return <div>User ID: {id}</div>;
}
```

#### 6. **`useLocation()` Hook**
- 获取当前 URL 信息（类似 `window.location`）
```js
const location = useLocation();
console.log(location.pathname); // "/users"
console.log(location.search);   // "?sort=name"
```

#### 7. **`<Outlet>`**
- **嵌套路由的占位符**，用于布局组件中渲染子路由
```jsx
// 布局组件
function DashboardLayout() {
  return (
    <div>
      <nav>...</nav>
      <Outlet /> {/* 子路由在此渲染 */}
    </div>
  );
}

// 路由配置
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardHome />} />
  <Route path="settings" element={<Settings />} />
</Route>
```

#### 8. **`useSearchParams()`**
- 读写 URL 查询参数（如 `?page=2&sort=name`）
```js
const [searchParams, setSearchParams] = useSearchParams();
const page = searchParams.get('page'); // "2"
setSearchParams({ page: 3 }); // 更新 URL 为 ?page=3
```

---

### 三、高级功能

| 功能 | 说明 |
|------|------|
| **嵌套路由** | 通过 `<Route>` 嵌套 + `<Outlet>` 实现布局复用 |
| **路由守卫** | 用自定义组件或 Hook 控制访问权限（如检查登录） |
| **懒加载路由** | 结合 `React.lazy` + `Suspense` 按需加载页面 |
| **404 页面** | 用 `<Route path="*" element={<NotFound />} />` 匹配任意未定义路径 |

---

### 总结

| 组件/Hook | 用途 |
|----------|------|
| `BrowserRouter` | 根路由容器（HTML5 模式） |
| `Routes` / `Route` | 定义路径与组件映射 |
| `Link` / `NavLink` | 声明式导航 |
| `useNavigate` | 编程式跳转 |
| `useParams` | 获取动态参数 |
| `useLocation` | 获取当前 URL 信息 |
| `Outlet` | 嵌套路由占位符 |
| `useSearchParams` | 读写查询参数 |

---
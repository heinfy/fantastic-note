React 服务端渲染（Server-Side Rendering, SSR）是指**在服务器上将 React 组件渲染为 HTML 字符串，再发送给浏览器**，从而提升首屏加载速度、SEO 友好性和用户体验。

---

### 一、SSR 的核心流程

```
用户请求 → 服务器
          ↓
服务器：1. 获取数据（如 API）
       2. 调用 React.renderToString() 渲染组件为 HTML
       3. 将 HTML + 初始数据注入页面
          ↓
浏览器：1. 显示静态 HTML（无需等待 JS 加载）
       2. 加载 JS 后“激活”（hydrate）——绑定事件、接管交互
```

> ✅ 关键优势：**首屏内容立即可见**，不依赖客户端 JS 执行。

---

### 二、原生实现 SSR

#### 1. 服务端（Node.js）
```js
// server.js
import express from 'express';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';

const app = express();

app.get('/', (req, res) => {
  // 1. 获取数据（伪代码）
  const initialData = fetchData(); 

  // 2. 渲染 React 组件为 HTML
  const html = renderToString(<App data={initialData} />);

  // 3. 返回完整 HTML 页面
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <!-- 注入初始数据，供客户端 hydrate 使用 -->
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};
        </script>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});
```

#### 2. 客户端（浏览器）
```js
// client.js
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

// 从 window 获取服务端注入的数据
const initialData = window.__INITIAL_DATA__;

// hydrate：将静态 HTML “激活”为可交互的 React 应用
hydrateRoot(
  document.getElementById('root'),
  <App data={initialData} />
);
```

> ⚠️ **问题**：需手动处理路由、数据获取、代码分割、CSS 等，非常繁琐。

---

### 三、推荐方案：使用成熟框架

#### ✅ 1. **Next.js（官方推荐，最流行）**
- 内置 SSR、SSG、ISR、API Routes、文件系统路由等
- 开箱即用，零配置

```jsx
// pages/index.js
export async function getServerSideProps() {
  // 在服务端执行，可访问数据库、私有 API
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  
  return { props: { data } }; // 自动注入到组件
}

export default function Home({ data }) {
  return <div>{data.title}</div>;
}
```
- 访问 `/` → 自动 SSR
- 部署支持 Vercel、Node.js 服务器等

#### ✅ 2. **Remix（新兴全栈框架）**
- 基于 Web 标准（Fetch、Form），强调用户体验
- 自动处理数据加载、表单提交、错误边界等

```jsx
// routes/index.jsx
export async function loader({ request }) {
  return json(await getData());
}

export default function Index() {
  const data = useLoaderData(); // 自动获取服务端数据
  return <div>{data.title}</div>;
}
```

---

### 四、SSR 的关键注意事项

| 问题 | 解决方案 |
|------|--------|
| **仅服务端运行的代码**（如 `fs`, `process.env`） | 用 `typeof window === 'undefined'` 判断环境 |
| **客户端/服务端状态同步** | 通过 `window.__INITIAL_STATE__` 注入初始数据 |
| **样式（CSS）服务端渲染** | 使用 CSS-in-JS（如 styled-components）或 CSS 提取插件 |
| **路由匹配** | 服务端需根据 URL 匹配对应组件（Next.js 自动处理） |
| **数据获取** | 在服务端预取数据，避免客户端二次请求 |
| **hydration 不匹配** | 确保服务端和客户端渲染的 HTML **完全一致**，否则报错 |

> ❌ 常见错误：  
> - 在服务端使用 `window`、`document`  
> - 客户端和服务端渲染内容不一致（如时间、随机数）

---

### 五、、总结

- **不要手写原生 SSR**：复杂度高，易出错
- **优先使用 Next.js 或 Remix**：它们解决了 90% 的 SSR 工程问题
- **核心价值**：
  - ✅ 首屏加载快（用户立刻看到内容）
  - ✅ SEO 友好（搜索引擎能抓取完整 HTML）
  - ✅ 弱网/低性能设备体验更好

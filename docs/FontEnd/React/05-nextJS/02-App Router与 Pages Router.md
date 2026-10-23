# App Router 与 Pages Router

`App Router` 和 `Pages Router` 是 Next.js 中两种不同的路由和应用组织方式。简单来说，**`Pages Router` 是旧的、基于文件的简单路由；而 `App Router` 是新的、基于 React 服务器组件的现代化架构**。

自 Next.js 13 引入 `App Router` 后，官方已明确推荐在所有新项目中使用它。

## 核心区别一览

| 特性 | App Router (`app` 目录) | Pages Router (`pages` 目录) |
| :--- | :--- | :--- |
| **数据获取** | **React 服务端组件** + `fetch` | `getStaticProps`, `getServerSideProps` |
| **组件类型** | **默认服务端组件**，客户端需显式声明 `"use client"` | **默认客户端组件** |
| **布局 (Layout)** | 原生支持嵌套布局 (`layout.js`) | 需手动封装或使用 `_app.js` |
| **加载/错误** | 内置 `loading.js` 和 `error.js` 文件 | 需手动实现 (如 `useRouter().isFallback`) |
| **渲染时机** | SSR 为主，支持静态导出 | 支持 SSG (静态生成) 和 SSR |

---

## 🔄 数据获取 API 的演变

这是两者最大的不同。`App Router` 利用 React 服务端组件的能力，让数据获取变得更直观。

### 1. `getStaticProps` / `getServerSideProps` 去哪儿了？

在 `App Router` 中，**你不再需要** `getStaticProps` 或 `getServerSideProps`。

*   **Pages Router 写法 (旧):**
    ```javascript
    // pages/posts/[id].js
    export async function getServerSideProps(context) {
      const res = await fetch(`https://.../posts/${context.params.id}`);
      const post = await res.json();
      return { props: { post } }; // 传递给页面组件
    }
    ```

*   **App Router 写法 (新):**
    你直接在一个**异步组件**中使用原生 `fetch`。
    ```javascript
    // app/posts/[id]/page.js
    // 注意：这是服务端组件，不需要导入 fetch
    export default async function Page({ params }) {
      const res = await fetch(`https://.../posts/${params.id}`, {
        // 在 App Router 中，fetch 的缓存策略更智能
        cache: 'no-store', // 相当于 getServerSideProps (每次都请求)
        // 或 cache: 'force-cache' // 相当于 getStaticProps (静态生成/缓存)
      });
      const post = await res.json();

      return <div>{post.title}</div>;
    }
    ```

### 2. `getStaticPaths` 去哪儿了？

在 `Pages Router` 中，你需要 `getStaticPaths` 来告诉 Next.js 哪些动态路由需要预渲染。

*   **Pages Router 写法 (旧):**
    ```javascript
    // pages/posts/[id].js
    export async function getStaticPaths() {
      return {
        paths: [{ params: { id: '1' } }, { params: { id: '2' } }],
        fallback: false,
      };
    }
    ```

*   **App Router 写法 (新):**
    通常不需要显式定义。当你使用 `generateStaticParams` 辅助函数时，主要用于生成静态路径（类似 SSG），但这通常用于生成静态站点时。
    ```javascript
    // app/posts/[id]/page.js
    export async function generateStaticParams() {
      // 用于生成静态 HTML 的路径
      return [{ id: '1' }, { id: '2' }];
    }

    export default function Page({ params }) {
      // 组件逻辑...
    }
    ```
    *注意：在 App Router 中，如果未静态生成，访问不存在的动态路由会自动返回 404 或触发 `not-found`。*

### 3. ISR (增量静态再生) 怎么办？

在 `Pages Router` 中，你使用 `revalidate` 选项。

*   **Pages Router:**
    ```javascript
    return { props: {}, revalidate: 60 }; // 60秒重新生成
    ```

*   **App Router:**
    通过配置 `fetch` 的 `next.revalidate` 选项来实现：
    ```javascript
    const res = await fetch('https://...', {
      next: { revalidate: 60 }, // 60秒重新验证
    });
    ```

---

## 🛠️ 其他重要 API 和概念变化

| Pages Router 概念 | App Router 对应方案 | 说明 |
| :--- | :--- | :--- |
| **`_app.js` / `_document.js`** | **`layout.js` / `template.js`** | `App Router` 中不需要 `_app.js` 来共享状态或布局，使用 `layout.js` 即可。`<html>` 和 `<body>` 标签移到了根 `layout` 中。 |
| **`getInitialProps`** | **不推荐 / 中间件** | 用于自定义 `_app`，在 App Router 中几乎不需要。复杂逻辑推荐使用中间件处理。 |
| **加载状态 (Skeleton)** | **`loading.js` 文件** | 在 Pages Router 中需用 `useRouter().isFallback` 判断；在 App Router 中，只需在目录下创建 `loading.js`，框架会自动处理过渡。 |
| **错误处理** | **`error.js` 文件** | 类似 `loading.js`，创建 `error.js` 文件即可捕获该路由下的错误边界。 |

## 💡 总结与建议

*   **如果你是新项目：** 请坚定地使用 **App Router**。
    *   它更符合现代 React 的数据流（Server Components）。
    *   代码更简洁，不需要在 `getStaticProps` 和组件之间传递 `props`。
    *   布局系统和加载状态管理更强大。

*   **如果你是老项目：** 可以继续使用 `Pages Router`，Next.js 会兼容。但建议逐步学习 App Router，因为它是 Next.js 未来的方向（如 Next.js 15+ 已全面转向 App Router 的最佳实践）。
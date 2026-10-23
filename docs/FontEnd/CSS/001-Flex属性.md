# Flex 属性

## `flex: 1` 的含义

`flex: 1;` 是一个简写属性，用于设置 Flex 项目（Flex 容器内的项目）的增长因子、缩减因子和基础大小，它是以下三个属性的简写：

1. `flex-grow`：增长因子。`1` 表示有剩余空间时，项目按比例增长以填充空间。
2. `flex-shrink`：缩减因子。`1` 表示空间不足时允许缩小；实际缩减量还与项目的基础尺寸有关，并不一定平均缩小。
3. `flex-basis`：分配空间之前项目的主轴基础尺寸。浏览器通常将 `flex: 1` 中省略的基础尺寸展开为 `0%`；主轴尺寸确定时，可以理解为从 0 开始计算。

因此，浏览器中的 `flex: 1;` 通常等价于 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%;`：项目从零基础尺寸开始，按增长比例分配剩余空间，并允许在空间不足时缩小。最终尺寸还受内容、最小尺寸和最大尺寸等约束影响。

## `flex: 0`、`flex: 1` 和 `flex: auto` 的区别

正确的关键字是 `auto`，`anto` 是拼写错误。理解这三种写法，需要先明确 `flex` 简写的顺序：

```css
/* 增长因子、缩减因子、基础尺寸 */
flex: <flex-grow> <flex-shrink> <flex-basis>;
```

- `flex-grow` 决定有剩余空间时如何分配，`0` 表示不参与增长。
- `flex-shrink` 决定空间不足时是否允许缩小，`0` 表示不缩小。
- `flex-basis` 决定分配空间前从多大开始计算。`auto` 通常先使用主轴上的 `width` 或 `height`；相应尺寸也是 `auto` 时，再根据内容计算。

浏览器通常将它们展开为：

```css
flex: 0;    /* 等价于 0 1 0%   */
flex: 1;    /* 等价于 1 1 0%   */
flex: auto; /* 等价于 1 1 auto */
```

### `flex: 0`：从零基础尺寸开始，不参与增长

`flex-grow: 0` 表示不分配剩余空间，`flex-basis: 0%` 表示在主轴尺寸确定时从零基础尺寸开始计算，`flex-shrink: 1` 表示允许缩小。

但 `flex: 0` 不代表实际宽度一定为 0，也不表示保持原来的 `width`。Flex 项目默认的主轴最小尺寸通常受内容影响，内容可能把项目撑开；边框、内边距、显式最小尺寸等也会影响最终大小。

### `flex: 1`：从零基础尺寸开始，参与分配剩余空间

`flex-grow: 1` 表示参与增长，`flex-basis: 0%` 表示在主轴尺寸确定时从零开始计算。

多个项目都设置为 `flex: 1` 时，在内容最小尺寸、边框、内边距、最大尺寸等约束不干扰的情况下，会得到相同的主轴尺寸。如果分别设置为 `flex: 1` 和 `flex: 2`，在同样的条件下，就按 1:2 的比例分配空间。

### `flex: auto`：从自身基础尺寸开始，再分配剩余空间

`flex: auto` 等价于 `1 1 auto`，允许增长和缩小，但计算基础尺寸时会先参考项目自身的 `width`、`height` 或内容。

多个项目都设置为 `flex: auto` 时，增长因子虽然相同，基础尺寸却可能不同，因此最终尺寸也可能不同。

**关键区别：`flex: 1` 从零基础尺寸起算，`flex: auto` 从自身基础尺寸起算。**

### 计算示例：600px 容器里的两个项目

假设容器横向排列且宽度为 `600px`，两个项目的 `width` 分别为 `100px` 和 `200px`。项目设置 `min-width: 0`，且没有间距、边框、内边距或其他最小/最大尺寸限制。

两个项目都使用 `flex: 1`：

```text
基础尺寸：0px、0px
剩余空间：600px - 0px - 0px = 600px
增长因子：1、1，每个项目分配 300px
最终宽度：300px、300px
```

两个项目都使用 `flex: auto`：

```text
基础尺寸：100px、200px
剩余空间：600px - 100px - 200px = 300px
增长因子：1、1，每个项目增加 150px
最终宽度：250px、350px
```

两个项目都使用 `flex: 0` 时，在上述条件下，基础尺寸为 0 且不参与增长，最终宽度均为 `0px`，剩余的 `600px` 不会分配给它们。

下面的示例可以直接观察 `flex: 1` 和 `flex: auto` 的区别：

```html
<style>
  .flex-demo {
    display: flex;
    width: 600px;
  }

  .flex-demo > div {
    min-width: 0;
    outline: 1px solid #666; /* outline 不占布局空间 */
  }

  .flex-demo > div:first-child {
    width: 100px;
  }

  .flex-demo > div:last-child {
    width: 200px;
  }

  .flex-demo-equal > div {
    flex: 1;
  }

  .flex-demo-auto > div {
    flex: auto;
  }
</style>

<!-- 最终宽度：300px、300px -->
<div class="flex-demo flex-demo-equal">
  <div>A</div>
  <div>B</div>
</div>

<!-- 最终宽度：250px、350px -->
<div class="flex-demo flex-demo-auto">
  <div>A</div>
  <div>B</div>
</div>
```

### 容易混淆的细节

- `flex: 0` 与默认值不同。Flex 项目的默认值是 `flex: 0 1 auto`，即不增长、允许缩小，且从自身基础尺寸开始计算。
- 如果希望项目保留自身基础尺寸，并且既不增长也不缩小，可以使用 `flex: none`，等价于 `0 0 auto`。
- 横向布局中，内容导致项目无法按预期缩小时，可以根据布局需要设置 `min-width: 0`；纵向布局对应的是 `min-height: 0`。
- `0%` 与 `0` 并非在所有情况下都等价。主轴尺寸确定时它们都可以按零计算；主轴尺寸不确定时，百分比基础尺寸会按内容处理，而长度 `0` 仍是零。例如，未指定高度的纵向 Flex 容器中，两者可能产生不同结果。

## 常见布局：sider 固定 + 主内容自适应

布局要求：

1. sider 宽度固定（或可响应式），占据整个屏幕高度，内容超出可滚动；
2. 右侧内容至少占据一屏：header 吸顶且高度不固定，content 自适应，footer 不限制；
3. 滚动元素为整个 body。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        display: flex;
        min-height: 100vh;
        overflow-y: auto;
      }

      .sider {
        width: 200px; /* 固定宽度，可以调整 */
        background-color: #f0f0f0;
        overflow-y: auto;
        height: 100vh;
        position: sticky;
        top: 0;
      }

      .container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      .header {
        position: sticky;
        top: 0;
        background-color: #ccc;
        z-index: 1;
        width: 100%;
      }

      .content {
        flex: 1;
        height: 40000px; /* 模拟超长内容，触发 body 滚动 */
        background-color: #fff;
      }

      .footer {
        background-color: #ccc;
      }
    </style>
  </head>
  <body>
    <div class="sider">menu</div>
    <div class="container">
      <header class="header">header</header>
      <div class="content">content</div>
      <footer class="footer">footer</footer>
    </div>
  </body>
</html>
```

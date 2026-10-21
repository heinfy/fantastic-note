横向可滚动 Tab 条：Tab 过多时支持左右翻页、边缘渐变遮罩，激活项自动滚入视口。支持受控 / 非受控、自定义标题、Ref 命令式滚动。

| 文件 | 说明 |
|------|------|
| `index.tsx` | 组件实现与类型导出 |
| `demo.tsx` | 三种用法示例，可在页面中挂载 `ScrollableTabsDemo` 查看 |

> 下方各节为可折叠块（`<details>`），点击标题展开 / 收起。文末附完整源码快照。

---

<details>
<summary><strong>快速使用</strong></summary>

```tsx
import ScrollableTabs from '@/components/ScrollableTabs';
import type { ScrollableTabItem, ScrollableTabsRef } from '@/components/ScrollableTabs';

// 非受控（items 每项需 key + title）
<ScrollableTabs
  items={[{ key: 'a', title: '标签 A' }]}
  defaultActiveKey="a"
  onChange={(key, rawItem, index) => {}}
/>

// 受控 + Ref
const ref = useRef<ScrollableTabsRef>(null);
<ScrollableTabs ref={ref} items={items} activeKey={active} onChange={(k) => setActive(k)} />
```

</details>

<details>
<summary><strong>数据类型</strong></summary>

### `ScrollableTabItem`

| 字段 | 必填 | 说明 |
|------|------|------|
| `key` | 是 | 唯一标识 |
| `title` | 是 | 默认展示标题（未传 `renderTitle` 时使用） |
| `disabled` | 否 | 为 `true` 时不可点击、键盘导航会跳过 |
| 其它字段 | — | 会作为 `rawItem` 传给 `onChange` / `renderTitle` |

### 泛型 `T`

`ScrollableTabs<T extends ScrollableTabItem>` 可扩展 Tab 项类型，便于在回调里拿到业务字段（如 demo 的 `status`）。

</details>

<details>
<summary><strong>Props</strong></summary>

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `items` | `T[]` | `[]` | Tab 列表，每项含 `key`、`title` |
| `activeKey` | `string \| number` | — | **受控**：当前选中 key；传入后内部不再维护选中态 |
| `defaultActiveKey` | `string \| number` | — | **非受控**：初始选中 key |
| `onChange` | `(key, rawItem, index) => void` | — | 点击可点击 Tab 时触发（disabled 不触发） |
| `renderTitle` | `(rawItem, index, active) => ReactNode` | — | 自定义标题；未传则使用 `title` |
| `showTooltip` | `boolean` | `true` | 标题为**纯字符串**且被截断时，设置原生 `title` 悬停提示 |
| `stepRatio` | `number` | `0.6` | 左右箭头单次滚动 = `可见宽度 × stepRatio` |
| `minStep` | `number` | `200` | 与上式结果取 **max**，避免窄容器滚太少 |
| `className` | `string` | `''` | 根容器 class |
| `style` | `CSSProperties` | — | 根容器 style，可与 CSS 变量合并 |
| `maskColor` | `string` | `#f5f5f5` | 左右渐变遮罩颜色，**建议与 Tab 区域背景一致** |
| `maxTabWidth` | `number` | `140` | 单个 Tab 最大宽度（px），超出截断 |
| `gap` | `number` | `8` | Tab 间距（px） |
| `ariaLabel` | `string` | `'Tabs'` | `role="tablist"` 的 `aria-label` |

#### 受控 vs 非受控

- 传 `activeKey` → 受控：切换后必须在 `onChange` 里更新 `activeKey`。
- 不传 `activeKey` → 非受控：用 `defaultActiveKey` 设初值，之后组件内部 `innerActiveKey` 管理。

</details>

<details>
<summary><strong>Ref（ScrollableTabsRef）</strong></summary>

| 方法 | 说明 |
|------|------|
| `scrollByPage('prev' \| 'next')` | 按 `stepRatio` / `minStep` 平滑横向滚动 |
| `scrollToKey(key, behavior?)` | 将对应 Tab 滚入视口，默认 `behavior: 'smooth'` |
| `updateScrollState()` | 手动重算是否可左/右滚（改 DOM 或布局后可调） |

</details>

<details>
<summary><strong>行为与实现要点</strong></summary>

#### 何时出现箭头与遮罩

- 读取滚动容器 `scrollLeft`、`scrollWidth`、`clientWidth`。
- `canScrollLeft`：`scrollLeft > 1`
- `canScrollRight`：`scrollLeft + clientWidth < scrollWidth - 1`  
  （±1 像素容差，减轻亚像素抖动）

#### 何时更新滚动状态

| 触发源 | 作用 |
|--------|------|
| 容器 `onScroll` → `handleScroll` | RAF 节流，每帧最多一次 `updateScrollState` |
| `ResizeObserver` 观察滚动容器 | 宽度 / 内容变化 |
| `window` `resize` | 视口变化 |
| `items.length` 变化 | `useLayoutEffect` |
| `currentKey` 变化 | `scrollToKey` + `updateScrollState`（激活 Tab 进视口） |

#### 键盘（焦点在 Tab 按钮上）

- `ArrowLeft` / `ArrowRight`：跳到上一个 / 下一个**未 disabled** 的 Tab（仅移动焦点，不自动选中）。
- `Home` / `End`：跳到第一个 / 最后一个可用 Tab。

选中仍靠 **点击**（`activateTab`）。激活 Tab 的 `tabIndex={0}`，其余为 `-1`。

#### 无障碍

- 滚动区域：`role="tablist"` + `ariaLabel`
- 每个 Tab：`role="tab"`、`aria-selected`、`aria-disabled`
- 翻页按钮：`aria-label` 为 Scroll tabs left/right

</details>

<details>
<summary><strong>样式与 CSS 变量</strong></summary>

根节点通过 `style` 注入（可被 props 覆盖）：

| 变量 | 来源 | 用途 |
|------|------|------|
| `--st-tabs-mask-color` | `maskColor` | 边缘渐变遮罩 |
| `--st-tabs-tab-max-width` | `maxTabWidth` | Tab `max-width` |
| `--st-tabs-gap` | `gap` | Tab 间距、根布局 gap |

滚动条隐藏：`scrollbar-width: none` + WebKit 伪元素隐藏。Tab 标题在内部 `truncate`。

</details>

<details>
<summary><strong>Demo 场景对照（demo.tsx）</strong></summary>

#### 1. 少量标签（无溢出）

- `defaultActiveKey="overview"`，非受控。
- `maskColor="#f5f5f5"` 与外层 `bg-neutral-100` 在 demo 里用接近的 `#f5f5f5`；**生产环境请与真实背景色一致**。
- `onChange` 仅 `console.log`。

#### 2. 溢出滚动 + 受控 + Ref

- 24 个长标题 Tab，`activeKey={activeMany}` + `setActiveMany`。
- `maxTabWidth={160}` 控制单列宽度。
- 外部按钮：选中首尾 Tab（验证自动滚入视口）、`tabsRef.current?.scrollByPage('next')` 演示 Ref。

#### 3. 自定义标题 + 禁用项

- `renderTitle`：标题前加状态圆点，`active` 时主题色。
- `showTooltip={false}`：自定义 ReactNode 标题不会走字符串 tooltip。
- `disabled: true` 的 `archived` 项不可点。

#### Demo 类型扩展示例

```tsx
interface DemoTab extends ScrollableTabItem {
  key: string;
  title: string;
  status?: 'ok' | 'idle';
}
```

</details>

<details>
<summary><strong>使用注意</strong></summary>

1. **`maskColor` 与背景**：遮罩是「从背景色到透明」的渐变；背景不是 `#f5f5f5` 时必须改 `maskColor`，否则边缘会露色或发灰。
2. **`showTooltip`**：仅当 `renderTitle` 返回**字符串**时生效；自定义 JSX 需自行做 Tooltip。
3. **受控未传 `activeKey` 初值**：可不设 `defaultActiveKey`，则初始可能无选中样式，直到用户点击。
4. **`onChange` 与 disabled**：disabled Tab 不会调用 `onChange`。
5. **`items` 数据结构**：直接使用 `ScrollableTabItem`（或扩展类型），组件内部不再做 normalize；调用方需保证 `key`、`title` 齐全。
6. **导出**：默认导出 `ScrollableTabs`；类型从同路径 `./index` 引入 `ScrollableTabsProps`、`ScrollableTabsRef` 等。

</details>

<details>
<summary><strong>结构示意</strong></summary>

```
[ ← 左箭头 ]  |  [ 渐变 ] [ Tab Tab Tab ... 横向滚动 ] [ 渐变 ]  |  [ 右箭头 → ]
              └─ 仅 canScrollLeft/Right 为 true 时显示箭头与对应侧遮罩
```

左箭头在滚动区域**左侧**；右箭头在**右侧**；中间 `flex-1 min-w-0` 保证在 flex 布局里可收缩并出现横向溢出。

</details>

---

<details>
<summary><strong>源码：index.tsx</strong>（与仓库文件同步快照）</summary>

```tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { cn } from 'cn';

/** Tab 项：对象需带 key，其余字段可自定义并透传给 onChange / renderTitle */
export interface ScrollableTabItem {
  key: string | number;
  title: string;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface ScrollableTabsProps<T extends ScrollableTabItem = ScrollableTabItem> {
  /** Tab 列表；每项需包含 key、title */
  items?: T[];
  /** 受控：当前选中的 Tab key；传入后选中态由父组件维护 */
  activeKey?: string | number;
  /** 非受控：初始选中的 Tab key */
  defaultActiveKey?: string | number;
  /** 切换 Tab 时触发，参数为 key、原始项、索引 */
  onChange?: (key: string | number, rawItem: T, index: number) => void;
  /** 自定义 Tab 标题渲染；未传则使用 title */
  renderTitle?: (rawItem: T, index: number, active: boolean) => ReactNode;
  /** 标题为纯文本且被截断时，是否使用原生 title 提示 */
  showTooltip?: boolean;
  /** 点击左右箭头时，单次滚动距离 = 可见宽度 × 该比例 */
  stepRatio?: number;
  /** 单次翻页最小步长（px），与 stepRatio 计算结果取较大值 */
  minStep?: number;
  /** 根容器额外 className */
  className?: string;
  /** 根容器内联样式，可与组件 CSS 变量一并生效 */
  style?: CSSProperties;
  /** 与容器背景一致的色值，用于左右边缘渐变遮罩 */
  maskColor?: string;
  /** 单个 Tab 最大宽度（px），超出部分截断 */
  maxTabWidth?: number;
  /** Tab 之间的间距（px） */
  gap?: number;
  /** 无障碍：tablist 的 aria-label */
  ariaLabel?: string;
}

/** 翻页滚动方向 */
export type ScrollDirection = 'prev' | 'next';

/** 通过 ref 暴露的命令式 API */
export interface ScrollableTabsRef {
  /** 按 stepRatio / minStep 向左或向右翻页滚动 */
  scrollByPage: (direction: ScrollDirection) => void;
  /** 将指定 key 的 Tab 滚入可视区域 */
  scrollToKey: (key: string | number, behavior?: ScrollBehavior) => void;
  /** 重新计算是否显示左右箭头与遮罩 */
  updateScrollState: () => void;
}

/** 左右翻页箭头图标 */
function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const path =
    direction === 'left'
      ? 'M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z'
      : 'M765.7 486.8L314.9 134.7c-5.3-4.1-12.9-.4-12.9 6.3v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z';
  return (
    <svg viewBox="0 0 1024 1024" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

/**
 * ScrollableTabs — 横向可滚动 Tab 条
 *
 * - 内容溢出时显示左右翻页与边缘渐变
 * - 激活项自动滚入视口
 * - 支持受控 / 非受控、自定义标题、主题 CSS 变量
 */
function ScrollableTabsInner<T extends ScrollableTabItem = ScrollableTabItem>(
  {
    items = [],
    activeKey,
    defaultActiveKey,
    onChange,
    renderTitle,
    showTooltip = true,
    stepRatio = 0.6,
    minStep = 200,
    className = '',
    style,
    maskColor,
    maxTabWidth,
    gap,
    ariaLabel = 'Tabs',
  }: ScrollableTabsProps<T>,
  ref: React.ForwardedRef<ScrollableTabsRef>,
) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  /** scroll 事件 RAF 节流，避免一帧内多次 setState */
  const scrollRafRef = useRef<number | null>(null);
  /** 各 Tab 按钮 DOM，供 scrollToKey 使用 */
  const tabButtonRefs = useRef<Map<string | number, HTMLButtonElement>>(new Map());

  /** 是否还能向左/右滚，控制箭头与边缘遮罩显隐 */
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  /** 非受控模式下的选中 key */
  const [innerActiveKey, setInnerActiveKey] = useState<string | number | undefined>(defaultActiveKey);

  const isControlled = activeKey !== undefined;
  const currentKey = isControlled ? activeKey : innerActiveKey;

  const rootStyle = useMemo((): CSSProperties => {
    // 动态值仍以 CSS 变量注入，Tailwind 类通过 var() 引用；style 中同名变量可覆盖默认值
    const vars: Record<string, string | number> = {
      '--st-tabs-mask-color': maskColor ?? '#f5f5f5',
      '--st-tabs-tab-max-width': `${maxTabWidth ?? 140}px`,
      '--st-tabs-gap': `${gap ?? 8}px`,
    };
    return { ...vars, ...style };
  }, [gap, maskColor, maxTabWidth, style]);

  /** 根据 scrollLeft 与内容宽度更新 canScrollLeft / canScrollRight */
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // ±1px 容差，减轻亚像素导致的箭头闪烁
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  /** 点击左右箭头时的平滑横向滚动 */
  const scrollByPage = useCallback(
    (direction: ScrollDirection) => {
      const el = scrollRef.current;
      if (!el) return;
      const step = Math.max(el.clientWidth * stepRatio, minStep);
      el.scrollBy({
        left: direction === 'next' ? step : -step,
        behavior: 'smooth',
      });
    },
    [minStep, stepRatio],
  );

  /** 激活项变化时滚入视口（inline: nearest 减少多余横向跳动） */
  const scrollToKey = useCallback((key: string | number, behavior: ScrollBehavior = 'smooth') => {
    const node = tabButtonRefs.current.get(key);
    node?.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollByPage,
      scrollToKey,
      updateScrollState,
    }),
    [scrollByPage, scrollToKey, updateScrollState],
  );

  /** 滚动容器 onScroll：合并到下一帧再 updateScrollState */
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      updateScrollState();
    });
  }, [updateScrollState]);

  /** 挂载滚动容器时绑定 ResizeObserver，卸载时断开 */
  const setScrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      scrollRef.current = node;
      if (!node) return;
      updateScrollState();
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(updateScrollState);
        resizeObserverRef.current.observe(node);
      }
    },
    [updateScrollState],
  );

  /** 点击 Tab：非受控更新 innerActiveKey，并通知 onChange */
  const activateTab = useCallback(
    (item: T, index: number) => {
      if (item.disabled) return;
      if (!isControlled) setInnerActiveKey(item.key);
      onChange?.(item.key, item, index);
    },
    [isControlled, onChange],
  );

  /** 键盘导航：将焦点移到指定索引的 Tab 按钮 */
  const focusTabByIndex = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      tabButtonRefs.current.get(item.key)?.focus();
    },
    [items],
  );

  /** 方向键 / Home / End 在 Tab 间移动焦点（跳过 disabled，不自动选中） */
  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const { key } = event;
      if (key === 'ArrowLeft') {
        event.preventDefault();
        for (let i = index - 1; i >= 0; i -= 1) {
          if (!items[i].disabled) {
            focusTabByIndex(i);
            return;
          }
        }
      }
      if (key === 'ArrowRight') {
        event.preventDefault();
        for (let i = index + 1; i < items.length; i += 1) {
          if (!items[i].disabled) {
            focusTabByIndex(i);
            return;
          }
        }
      }
      if (key === 'Home') {
        event.preventDefault();
        for (let i = 0; i < items.length; i += 1) {
          if (!items[i].disabled) {
            focusTabByIndex(i);
            return;
          }
        }
      }
      if (key === 'End') {
        event.preventDefault();
        for (let i = items.length - 1; i >= 0; i -= 1) {
          if (!items[i].disabled) {
            focusTabByIndex(i);
            return;
          }
        }
      }
    },
    [focusTabByIndex, items],
  );

  // Tab 数量变化后同步箭头/遮罩状态（布局已提交）
  useLayoutEffect(() => {
    updateScrollState();
  }, [items.length, updateScrollState]);

  // 选中项变化：滚到对应 Tab 并刷新滚动边界
  useEffect(() => {
    if (currentKey == null) return;
    scrollToKey(currentKey);
    updateScrollState();
  }, [currentKey, scrollToKey, updateScrollState]);

  // 视口尺寸变化 + 组件卸载清理
  useEffect(() => {
    window.addEventListener('resize', updateScrollState);
    return () => {
      window.removeEventListener('resize', updateScrollState);
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [updateScrollState]);

  // 翻页按钮样式（前后共用）
  const navClass =
    'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-input bg-background text-muted-foreground transition-colors hover:border-ring hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
  // 边缘渐变遮罩样式（左右共用）；to 色用 color-mix 实现同色透明，避免渐变发灰
  const maskBaseClass =
    'pointer-events-none absolute inset-y-0 z-10 w-8 from-(--st-tabs-mask-color) from-30% to-(--st-tabs-mask-color)/0';

  return (
    <div className={cn('flex items-center gap-(--st-tabs-gap)', className)} style={rootStyle}>
      {/* 左侧翻页按钮：仅内容可向左滚时显示 */}
      {canScrollLeft && (
        <button
          type="button"
          className={navClass}
          aria-label="Scroll tabs left"
          onClick={() => scrollByPage('prev')}
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      {/* min-w-0：在 flex 父级中允许收缩，才能出现横向溢出 */}
      <div className="relative min-w-0 flex-1">
        {canScrollLeft && (
          <div className={cn(maskBaseClass, 'left-0 bg-linear-to-r')} aria-hidden="true" />
        )}

        <div
          ref={setScrollContainerRef}
          className="flex flex-nowrap gap-(--st-tabs-gap) overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={ariaLabel}
          onScroll={handleScroll}
        >
          {items.map((item, index) => {
            const isActive = item.key === currentKey;
            const titleNode = renderTitle ? renderTitle(item, index, isActive) : item.title;
            // 仅纯文本标题才挂原生 title，自定义 ReactNode 需自行做 Tooltip
            const tooltip =
              showTooltip && typeof titleNode === 'string' ? titleNode : undefined;

            return (
              <button
                key={String(item.key)}
                type="button"
                role="tab"
                ref={(node) => {
                  if (node) tabButtonRefs.current.set(item.key, node);
                  else tabButtonRefs.current.delete(item.key);
                }}
                id={`st-tab-${String(item.key)}`}
                className={cn(
                  'flex max-w-(--st-tabs-tab-max-width) shrink-0 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2.5 text-left transition-colors hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50',
                  isActive && 'border-primary bg-primary/5',
                )}
                aria-selected={isActive}
                aria-disabled={item.disabled || undefined}
                tabIndex={isActive ? 0 : -1}
                title={tooltip}
                disabled={item.disabled}
                onClick={() => activateTab(item, index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span className="block min-w-0 truncate text-[13px] font-semibold text-foreground">
                  {titleNode}
                </span>
              </button>
            );
          })}
        </div>

        {canScrollRight && (
          <div className={cn(maskBaseClass, 'right-0 bg-linear-to-l')} aria-hidden="true" />
        )}
      </div>

      {/* 右侧翻页按钮 */}
      {canScrollRight && (
        <button
          type="button"
          className={navClass}
          aria-label="Scroll tabs right"
          onClick={() => scrollByPage('next')}
        >
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
  );
}

// forwardRef + 泛型断言，使 ScrollableTabs<T> 在 JSX 中保留 items 类型
const ScrollableTabs = forwardRef(ScrollableTabsInner) as <
  T extends ScrollableTabItem = ScrollableTabItem,
>(
  props: ScrollableTabsProps<T> & { ref?: React.ForwardedRef<ScrollableTabsRef> },
) => React.ReactElement | null;

export default ScrollableTabs;

```

</details>

<details>
<summary><strong>源码：demo.tsx</strong>（与仓库文件同步快照）</summary>

```tsx
import { useRef, useState } from 'react';
import { cn } from 'cn';
import ScrollableTabs from './index';
import type { ScrollableTabItem, ScrollableTabsRef } from './index';

/** Demo 用 Tab 类型 */
interface DemoTab extends ScrollableTabItem {
  key: string;
  title: string;
  status?: 'ok' | 'idle';
}

/** 外层卡片容器：注意 maskColor 需与这里的背景色保持一致 */
const sectionClass = 'mb-6 rounded-lg bg-neutral-100 p-4';
const headingClass = 'mb-3 text-sm font-medium text-neutral-500';
// demo 底部的控制按钮样式
const controlButtonClass =
  'cursor-pointer rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent';

const fewTabs: DemoTab[] = [
  { key: 'overview', title: '概览' },
  { key: 'metrics', title: '指标' },
  { key: 'settings', title: '设置' },
];

const manyTabs: DemoTab[] = Array.from({ length: 24 }, (_, i) => ({
  key: `item-${i + 1}`,
  title: `工作区 ${String.fromCharCode(65 + (i % 26))} — 长标题示例 ${i + 1}`,
  status: i % 3 === 0 ? 'ok' : 'idle',
}));

export default function ScrollableTabsDemo() {
  const tabsRef = useRef<ScrollableTabsRef>(null);
  const [activeMany, setActiveMany] = useState<string | number>('item-1');
  const [activeCustom, setActiveCustom] = useState<string | number>('overview');

  return (
    <div className="mx-auto my-10 max-w-[720px] text-left">
      <h2 className="mb-6 text-xl font-semibold text-foreground">可滚动标签页</h2>

      <div className={sectionClass}>
        <h3 className={headingClass}>1. 少量标签（无溢出）</h3>
        <ScrollableTabs<DemoTab>
          items={fewTabs}
          defaultActiveKey="overview"
          maskColor="#f5f5f5"
          onChange={(key) => console.log('非受控切换:', key)}
        />
      </div>

      <div className={sectionClass}>
        <h3 className={headingClass}>2. 溢出滚动 + 受控（当前：{activeMany}）</h3>
        <ScrollableTabs<DemoTab>
          ref={tabsRef}
          items={manyTabs}
          activeKey={activeMany}
          maskColor="#f5f5f5"
          maxTabWidth={160}
          onChange={(key) => setActiveMany(key)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={controlButtonClass} onClick={() => setActiveMany('item-24')}>
            选中最后一项
          </button>
          <button type="button" className={controlButtonClass} onClick={() => setActiveMany('item-1')}>
            选中第一项
          </button>
          <button
            type="button"
            className={controlButtonClass}
            onClick={() => tabsRef.current?.scrollByPage('next')}
          >
            向右翻页
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className={headingClass}>3. 自定义标题 + 禁用项</h3>
        <ScrollableTabs<DemoTab>
          items={[
            ...fewTabs,
            { key: 'archived', title: '已归档（禁用）', disabled: true },
          ]}
          activeKey={activeCustom}
          maskColor="#f5f5f5"
          showTooltip={false}
          onChange={(key) => setActiveCustom(key)}
          renderTitle={(item, _index, active) => (
            <span className="inline-flex items-center gap-1.5">
              {/* 状态点：激活时高亮为主题色 */}
              <span
                className={cn(
                  'size-1.5 shrink-0 rounded-full',
                  active ? 'bg-primary' : 'bg-neutral-300',
                )}
              />
              {item.title}
            </span>
          )}
        />
      </div>
    </div>
  );
}

```

</details>

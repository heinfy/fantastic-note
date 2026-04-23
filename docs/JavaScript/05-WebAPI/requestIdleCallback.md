`requestIdleCallback` 是浏览器提供的一种 **协作式调度（cooperative scheduling）** API，用于在浏览器**主线程空闲时**执行低优先级任务，避免阻塞关键操作（如用户交互、动画、渲染等），从而提升页面响应性和流畅度。

---

## 一、核心目的

> **把非紧急任务延迟到“浏览器有空”的时候再执行**，不干扰高优先级工作（如渲染、输入响应）。

适用于：
- 大数据分片处理（如你之前的 20000 个色块渲染）
- 日志上报
- 预加载非关键资源
- 初始化非核心功能模块

---

## 二、基本语法

```js
const id = requestIdleCallback(callback[, options]);
```

参数说明：

1. `callback(deadline)`
- 浏览器在空闲时调用此函数。
- `deadline` 对象包含两个关键属性：
  - `timeRemaining()`：返回当前空闲周期**还剩多少毫秒**（通常 ≤ 50ms）。
  - `didTimeout`：布尔值，表示是否因超时而被强制执行（见 `timeout` 选项）。

2. `options`（可选）
- `timeout`：指定一个截止时间（毫秒）。  
  如果超过这个时间还没执行，浏览器会**强制调用 callback**（即使主线程很忙），避免任务饿死。

```js
requestIdleCallback(myTask, { timeout: 2000 }); // 最多等 2 秒
```

3. 返回值：
- 一个 ID，可用于取消任务：
  ```js
  cancelIdleCallback(id);
  ```

---

## 三、工作原理（结合浏览器帧）

浏览器每帧（≈16.67ms @ 60fps）要完成：
1. 处理用户输入
2. 执行 JS（事件、定时器等）
3. 样式计算、布局（reflow）
4. 绘制（paint）、合成（composite）

✅ `requestIdleCallback` 的回调会在 **一帧的末尾、如果还有剩余时间** 时执行。

> 📌 **每帧最多只有几毫秒空闲时间**（理想情况 < 50ms），所以你的任务必须能**分片执行**！

---

## 四、典型使用模式：任务分片（Chunking）

```js
let tasks = getBigTaskList(); // 比如 10000 个任务

function performTasks(deadline) {
  // 只要还有任务，且当前空闲周期还有时间，就继续做
  while (tasks.length > 0 && deadline.timeRemaining() > 0) {
    const task = tasks.shift();
    process(task); // 执行单个任务（必须轻量！）
  }

  // 如果任务没做完，继续请求下一个空闲周期
  if (tasks.length > 0) {
    requestIdleCallback(performTasks);
  }
}

requestIdleCallback(performTasks);
```

> ✅ 关键：**每次只做一小部分，避免耗尽空闲时间**。

---

## 五、注意事项 & 最佳实践

1. **不要执行长时间任务**  
   即使 `timeRemaining()` 返回 50ms，也建议单次执行 ≤ 5ms，留余量给浏览器。

2. **避免 DOM 操作**  
   空闲回调中修改 DOM 可能触发 layout/paint，反而破坏性能。建议只做计算，结果批量更新。

3. **`timeout` 要谨慎使用**  
   设置 `timeout` 会导致任务在主线程繁忙时强行执行，失去“空闲调度”意义。仅用于防止任务永远不执行。

4. **不是实时调度器**  
   如果页面一直在忙碌（如持续动画），`requestIdleCallback` 可能**永远不会执行**！

5. **React 已内置类似机制**  
   React 18 的并发特性（如 `startTransition`）底层使用了更高级的调度策略，通常无需手动用 `requestIdleCallback`。

---

## 六、示例：安全地分批渲染大量元素

```js
import React, { useCallback, useEffect, useRef, useState } from "react";

/* 获取随机颜色 */
function getColor () {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgba(${r},${g},${b},0.8)`;
}

/* 获取随机位置 */
interface Position {
  width: number;
  height: number;
}

function getPosition (position: Position) {
  const { width, height } = position;
  return {
    left: Math.ceil(Math.random() * width) + 'px',
    top: Math.ceil(Math.random() * height) + 'px'
  };
}

/* 色块组件 */
interface CircleProps {
  position: Position;
}

function Circle ({ position }: CircleProps) {
  const style: React.CSSProperties = React.useMemo(() => {
    return {
      background: getColor(),
      ...getPosition(position),
      width: 10,
      height: 10,
      position: 'absolute'
    };
  }, [position]);

  return <div style={style} className="circle" />;
}

/* 函数式 Index 组件 */
function Index () {
  const [renderList, setRenderList] = useState<React.ReactNode[]>([]);
  const [position, setPosition] = useState<Position>({ width: 0, height: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const dataListRef = useRef<number[]>([]);
  const [eachRenderNum] = useState<number>(5);

  // 用于存储最新的 toRenderList 函数引用，解决递归调用时的声明顺序和闭包问题
  const toRenderListRef = useRef<((index: number, totalTimes: number) => void) | null>(null);

  // 渲染一批新元素
  const renderNewList = useCallback((startIndex: number) => {
    const list = dataListRef.current.slice(
      (startIndex - 1) * eachRenderNum,
      startIndex * eachRenderNum
    );
    return list.map((_, index) => (
      <Circle position={position} key={(startIndex - 1) * eachRenderNum + index} />
    ));
  }, [position, eachRenderNum]);

  // 分批渲染逻辑
  const toRenderList = useCallback((index: number, totalTimes: number) => {
    if (index > totalTimes) return;

    setRenderList(prev => [...prev, renderNewList(index)]);

    requestIdleCallback(() => {
      // 通过 ref 调用最新版本的函数，避免“使用前未声明”及闭包旧值问题
      if (toRenderListRef.current) {
        toRenderListRef.current(index + 1, totalTimes);
      }
    });
  }, [renderNewList]);

  // 将最新的 toRenderList 赋值给 ref
  useEffect(() => {
    toRenderListRef.current = toRenderList;
  }, [toRenderList]);

  // 初始化数据和容器尺寸
  useEffect(() => {
    if (!boxRef.current) return;

    const { offsetWidth, offsetHeight } = boxRef.current;
    setPosition({ width: offsetWidth, height: offsetHeight });

    // 创建 20000 条数据
    const originList: number[] = new Array(20000).fill(1);
    dataListRef.current = originList;

    const totalTimes: number = Math.ceil(originList.length / eachRenderNum);

    // 启动渲染
    toRenderList(1, totalTimes);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在挂载时执行一次

  return (
    <div
      className="bigData_index"
      ref={boxRef}
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
    >
      {renderList}
    </div>
  );
}

export default Index;
```

---

## 总结

| 特性 | 说明 |
|------|------|
| **作用** | 在浏览器空闲时执行低优先级任务 |
| **核心方法** | `requestIdleCallback(callback, { timeout })` |
| **关键参数** | `deadline.timeRemaining()` 判断剩余时间 |
| **适用场景** | 大数据处理、非关键初始化、日志上报 |
| **兼容性** | Chrome/Edge 支持，Firefox/Safari 不支持 |
| **替代方案** | `setTimeout` + 分片，或使用 React 并发特性 |

> ✨ **记住**：`requestIdleCallback` 是“礼貌地请求空闲时间”，不是“保证执行”。设计任务时必须考虑它可能延迟甚至不执行。
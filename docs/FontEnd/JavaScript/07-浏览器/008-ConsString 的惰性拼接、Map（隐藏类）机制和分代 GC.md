# ConsString 的惰性拼接、Map（隐藏类）机制和分代 GC

V8 的高性能不仅来自 Smi 和指针标记，还依赖于三大核心优化机制：`ConsString` 的惰性拼接、`Map`（隐藏类）实现快速属性访问、分代垃圾回收高效管理内存。

## ConsString：字符串拼接的惰性优化

### 问题背景

频繁字符串拼接（如 `a + b + c`）若每次都分配新内存并拷贝内容，性能极差。

### V8 的解决方案

不立即拼接，而是构建一个**二叉树**（`ConsString`）：

```js
let s = "A" + "B" + "C" + "D";
// 实际结构：((A+B)+C)+D
```

```cpp
class ConsString : public String {
  String* left_;
  String* right_;
};
```

- 只有在**真正需要扁平化字符串**时（如调用 `.length`、`.charAt()`、或传递给 C++ API），V8 才递归遍历树并分配新字符串。
- 如果拼接结果很短（< 13 字节），V8 会直接扁平化（避免小树开销）。
- 优势：避免中间字符串的内存分配和拷贝，对大量拼接（如日志生成）性能提升显著。
- 缺陷：深度过大可能导致栈溢出（V8 限制深度），现代 V8 在某些场景（如模板字符串）会预判并提前扁平化。

## Map（隐藏类）：实现快速属性访问

### 核心思想

JavaScript 对象是动态的（可随时增删属性），若每次访问属性都查哈希表，速度太慢。V8 的解决方案是 **Map + 偏移量访问**。

如果多个对象具有**相同属性名和顺序**，V8 为它们分配**同一个 Map**。Map 描述了对象的"形状"（shape），包括属性名列表和每个属性在对象内存中的**偏移量（offset）**。

```js
let obj1 = { x: 1, y: 2 };
let obj2 = { x: 3, y: 4 };
```

V8 创建一个 Map M1：`{ x: offset 0, y: offset 1 }`，`obj1` 和 `obj2` 共享 M1，访问 `obj1.x` 时直接读取 `obj1 + 0 * word_size`，**无需哈希查找**。

### 动态添加属性：Map 转换链

```js
let obj = { x: 1 };  // Map M0: {x}
obj.y = 2;           // 创建新 Map M1: {x, y}，obj 切换到 M1
```

V8 构建 **Map 转换树（Transition Tree）**，记录属性添加路径。多个对象按相同顺序添加属性则共享同一 Map。

### 性能注意

不同顺序初始化属性会导致多个 Map，降低性能：

```js
// 反模式：创建两个 Map
let a = { x: 1, y: 2 };
let b = { y: 2, x: 1 };
```

### 内存布局

对象在堆中实际存储为：

```text
[ Map pointer ] ← 所有对象都有
[ x (Smi)     ]
[ y (HeapObj) ]
...
```

属性值直接内联存储（fast properties），只有动态属性过多时才退化为字典模式（dictionary mode）。属性访问速度接近 C 结构体，JIT（TurboFan）可基于 Map 做激进优化（如内联缓存 IC）。

## 分代垃圾回收（Generational GC）

### 分代假说

JavaScript 对象生命周期差异大：大量临时对象（如循环中的数组）快速死亡，少量长期对象（如全局配置）长期存活。全堆扫描 GC 效率低下。

### 堆分区

| 代 | 名称 | 存储对象 | GC 频率 |
|----|------|--------|--------|
| 新生代（Young Generation） | Scavenge Space | 新分配的对象 | 高频（毫秒级） |
| 老生代（Old Generation） | Mark-Sweep/Compact Space | 存活多次 GC 的对象 | 低频 |

新生代进一步分为 **From-Space** 和 **To-Space**（半空间），新对象分配在 From-Space，GC 时存活对象复制到 To-Space，然后交换角色（**Cheney 算法**）。

### GC 流程

**Minor GC（Scavenge）**：仅扫描新生代，使用复制算法——遍历 From-Space 中存活对象复制到 To-Space，清空 From-Space。只需处理少量存活对象，速度快。若对象经历 2 次 Scavenge 仍存活则移入老生代（晋升）。

**Major GC（Mark-Sweep-Compact）**：扫描整个堆（主要是老生代），标记所有可达对象，回收未标记对象内存，可选地移动对象消除碎片。

现代 V8（Orinoco GC）支持**并发标记**（GC 线程与 JS 主线程并行）和**增量 GC**（将 GC 工作分片，避免长时间停顿）。

### 不同类型的 GC 管理

- **Smi**：无 GC 压力（不分配在堆）；
- **字符串**：internalized 字符串存于老生代，临时字符串在新生代快速回收；
- **普通对象**：先在新生代，长期存活后晋升。

## 三大机制协同工作示例

```js
function createUser(name, age) {
  let id = "user_" + name;           // → 可能生成 ConsString
  return { id, age };                // → 创建新对象，使用 Map
}
let user = createUser("Alice", 30);  // 对象先在新生代
setTimeout(() => console.log(user), 1000); // user 晋升到老生代
```

## 总结

| 机制 | 解决的问题 | 核心技术 | 性能收益 |
|------|----------|--------|--------|
| **ConsString** | 字符串拼接开销 | 惰性二叉树 + 按需扁平化 | 减少内存分配与拷贝 |
| **Map（隐藏类）** | 动态对象属性访问慢 | 形状共享 + 偏移量访问 | 属性访问达原生速度 |
| **分代 GC** | 全堆 GC 停顿长 | 新生代 Scavenge + 老生代 Mark-Sweep | 低延迟、高吞吐 |

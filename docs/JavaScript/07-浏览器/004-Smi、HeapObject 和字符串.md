V8 引擎为了极致性能，在底层对 JavaScript 值的表示做了高度优化。它使用一种称为 **“指针标记”（Pointer Tagging）** 的技术，将不同类型的数据（如整数、对象、字符串等）统一用 64 位（或 32 位）字（word）表示，并通过低位 bit 区分类型。

---

## 一、V8 的统一值表示：`TaggedValue`

在 V8 中，所有 JavaScript 值（包括数字、对象、undefined 等）都用一个 **`TaggedValue`**（也叫 `Object*` 或 `Handle<Object>`）表示 —— 本质上是一个 **机器字（machine word）**，通常是 64 位（在 64 位系统上）。

V8 利用这个字的**最低几位（tag bits）** 来区分值的类型：

| 类型 | 最低 2 位（64 位系统） | 存储方式 |
|------|------------------------|--------|
| **Smi（小整数）** | `00` | 值直接内联（无需堆分配） |
| **HeapObject（堆对象）** | `01` | 指向堆中对象的指针 |
| **其他特殊值**（如 `undefined`, `null`, `true`, `false`） | `11` | 用预定义的常量指针表示 |

> ✅ 这种设计避免了为每个值分配额外的类型字段，节省内存并加速类型判断。

---

## 二、Smi（Small Integer）的表示

### 1. 什么是 Smi？
- Smi = **Small Integer**
- 表示范围内的整数可**直接编码在指针中**，**无需堆分配**。
- 在 64 位系统上，V8 使用 **32 位有符号整数**作为 Smi（实际用 31 位，因需左移 1 位）。

### 2. 编码方式（64 位系统）
```text
Smi 值 N → 实际存储为 `(N << 1) | 0b00`
```
- 左移 1 位腾出最低位；
- 最低位设为 `00` 表示 Smi。

✅ 例如：
- `100` → `100 << 1 = 200` → 二进制 `...11001000`（末两位 `00`）
- `-1` → `-1 << 1 = -2` → 二进制 `...11111110`（末两位 `00`）

### 3. 范围
- 64 位系统：**-2³¹ 到 2³¹−1**（即 -2,147,483,648 到 2,147,483,647）
- 超出此范围的数字 → 转为 `HeapNumber`（堆对象）

### 4. 优势
- 算术运算极快（直接 CPU 整数运算）；
- 无 GC 压力；
- 对象属性若为 Smi，可内联存储（fast properties）。

---

## 三、HeapObject（堆对象）的表示

### 1. 什么是 HeapObject？
- 所有需要堆分配的对象：普通对象、数组、函数、字符串、大数字、Symbol 等。
- 在 V8 中，所有 HeapObject 都继承自 `HeapObject` 基类。

### 2. 指针表示
- 实际指针地址是 **8 字节对齐** 的（即末三位为 `000`）。
- V8 将最低位置为 `01`，其余高位存真实地址：

```text
真实地址 A（8-byte aligned）→ TaggedValue = A | 0b01
```

✅ 例如：
- 对象在堆地址 `0x1000` → 存储为 `0x1001`（末两位 `01`）

### 3. 解包（Untagging）
当 V8 需要访问对象时：
```cpp
// 伪代码
if ((value & 3) == 1) {
  HeapObject* obj = reinterpret_cast<HeapObject*>(value - 1);
}
```

### 4. HeapObject 结构
每个 HeapObject 在堆中包含：
- **Map 指针**：指向描述对象结构的隐藏类（Hidden Class）；
- **实例数据**：属性、元素等；
- **元信息**：GC 标记、大小等。

---

## 四、字符串（String）与字符串表（String Table）

### 1. 字符串也是 HeapObject
- 所有字符串（无论长短）都是 `HeapObject` 的子类（`SeqString`, `ConsString`, `SlicedString` 等）。
- 因此，字符串变量存的是 **带 tag 的堆指针**（末两位 `01`）。

### 2. 字符串表（Internalized String Table）
V8 维护一个全局的 **字符串哈希表（string table）**，用于：
- **去重**：相同内容的字符串只存一份；
- **快速比较**：`str1 === str2` 只需比较指针；
- **属性名优化**：对象属性名通常被 internalized。

#### Internalized String（内部化字符串）
- 字面量字符串（如 `'hello'`）、属性名（如 `obj.name` 中的 `'name'`）会被自动 internalized。
- 存入 **字符串表**，生命周期通常较长。

#### Non-internalized String
- 动态生成的字符串（如 `'a' + 'b'`）可能不立即 internalized；
- 但可通过 `String.intern()` 或某些操作触发 internalization。

### 3. 字符串的内部表示
V8 根据字符串内容和构造方式选择不同子类型：
| 类型 | 说明 |
|------|------|
| `SeqOneByteString` | 单字节字符（ASCII），连续存储 |
| `SeqTwoByteString` | 双字节字符（UTF-16） |
| `ConsString` | 拼接字符串（如 `a + b`），由左右子串组成（延迟拼接） |
| `SlicedString` | 子串（如 `str.substring(1,3)`），引用原字符串 + 偏移 |

> ✅ 这种设计避免了不必要的内存拷贝。

---

## 五、特殊值的表示（`null`, `undefined`, `true`, `false`）

这些值也用预定义的 **immediate values** 表示，末两位为 `11`：

| 值 | TaggedValue（64 位，十六进制） |
|----|-------------------------------|
| `undefined` | `0x00000004`（末两位 `00`？实际是特殊常量）|
| `null`      | `0x00000000`（历史原因，`typeof null === 'object'`）|
| `true`      | `0x00000009` |
| `false`     | `0x00000005` |

> 💡 实际值在 V8 源码中定义为常量（如 `Roots::kUndefinedValue`），通过全局 roots 表访问。

---

## 六、可视化：64 位 TaggedValue 布局

```
63                32 31                 2 1 0
┌───────────────────┬────────────────────┬───┐
│     Payload       │   Address / Value  │Tag│
└───────────────────┴────────────────────┴───┘
```

- **Smi**：`Tag = 00`，Payload = 整数值 `<<` 1
- **HeapObject**：`Tag = 01`，Payload = 堆地址（8-byte aligned）
- **Other**：`Tag = 11`，Payload = 特殊常量 ID

---

## 七、为什么这样设计？

| 目标 | 实现方式 |
|------|--------|
| **高性能类型判断** | 通过低位 bit 快速分支（无需查类型表） |
| **减少内存分配** | Smi 无需堆分配 |
| **快速相等比较** | internalized 字符串比地址即可 |
| **紧凑内存布局** | 对象属性可内联 Smi，减少指针跳转 |

---

## 总结

| 概念 | 底层表示 | 存储位置 | 关键特点 |
|------|--------|--------|--------|
| **Smi** | `(value << 1) \| 0b00` | 内联（栈/对象字段） | 无堆分配，快速运算 |
| **HeapObject** | `address \| 0b01` | 堆 | 包含 Map 和数据 |
| **字符串** | HeapObject 子类 | 堆 + 字符串表 | internalized 实现去重和快速比较 |

> 💡 正是这些底层优化，让 JavaScript 在 V8 上能达到接近原生代码的性能。

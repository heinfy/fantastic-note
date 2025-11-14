> PostgreSQL 提供了非常丰富和强大的数据类型系统，不仅支持标准 SQL 类型，还支持许多扩展类型（如数组、JSON、范围、几何、网络地址等），甚至允许用户自定义类型。

以下是 PostgreSQL 中**常用的数据类型分类与说明**：

---

## 一、**数值类型（Numeric Types）**

| 类型 | 说明 | 存储大小 | 示例 |
|------|------|--------|------|
| `SMALLINT` | 小整数 | 2 字节 | -32768 到 32767 |
| `INTEGER` / `INT` | 整数 | 4 字节 | -2147483648 到 +2147483647 |
| `BIGINT` | 大整数 | 8 字节 | ±9.2 × 10¹⁸ |
| `SAMLLSERIAL` | 自增的小范围整数 | 2 字节 | 1 到 32767 |
| `SERIAL` | 自增整数（自动创建序列） | 4 字节 | 1 到 2147483647，常用于主键 |
| `BIGSERIAL` | 自增大整数 | 8 字节 | 1 到 9223372036854775807 |
| `DECIMAL(p,s)` / `NUMERIC(p,s)` | 精确小数（任意精度） | 可变 | 金融计算推荐使用，小数点前 131072 位；小数点后 16383 位 |
| `REAL` | 单精度浮点 | 4 字节 | 6 位十进制数字精度，IEEE 754 |
| `DOUBLE PRECISION` | 双精度浮点 | 8 字节 | 	15 位十进制数字精度，IEEE 754 |

> 💡 `NUMERIC` 和 `DECIMAL` 是完全一样的，适合需要精确计算的场景（如金额）。

### SQL 示例

```PostgreSQL
-- 1. 创建一张包含 所有常用数值类型的表
CREATE TABLE numeric_demo (
    id            SMALLSERIAL PRIMARY KEY,        -- 自增小整数主键
    tiny_int      SMALLINT,
    normal_int    INTEGER,
    big_int       BIGINT,
    auto_int      SERIAL,                         -- 自增整数（4字节）
    auto_bigint   BIGSERIAL,                      -- 自增大整数（8字节）
    precise_num   NUMERIC(10, 2),                 -- 精确小数，共10位，2位小数
    price         DECIMAL(12, 4),                 -- 同 NUMERIC，用于价格
    single_float  REAL,
    double_float  DOUBLE PRECISION
);

-- 2. 添加注释
-- 表注释
COMMENT ON TABLE numeric_demo IS '数值类型演示表';

-- 字段注释
COMMENT ON COLUMN numeric_demo.id IS '主键，SMALLSERIAL 自增（1~32767）';
COMMENT ON COLUMN numeric_demo.tiny_int IS '小整数（-32768 ~ 32767）';
COMMENT ON COLUMN numeric_demo.normal_int IS '标准整数';
COMMENT ON COLUMN numeric_demo.big_int IS '大整数';
COMMENT ON COLUMN numeric_demo.auto_int IS 'SERIAL 自增整数（由序列生成）';
COMMENT ON COLUMN numeric_demo.auto_bigint IS 'BIGSERIAL 自增大整数';
COMMENT ON COLUMN numeric_demo.precise_num IS '精确数值，用于金额等（10位，2位小数）';
COMMENT ON COLUMN numeric_demo.price IS '价格，DECIMAL 类型（12位，4位小数）';
COMMENT ON COLUMN numeric_demo.single_float IS '单精度浮点数';
COMMENT ON COLUMN numeric_demo.double_float IS '双精度浮点数';

-- 3. 插入示例数据
INSERT INTO numeric_demo (
    tiny_int,
    normal_int,
    big_int,
    precise_num,
    price,
    single_float,
    double_float
) VALUES
(
    100,
    1000000,
    123456789012345,
    12345678.90,
    12345678.9999,
    3.14159::REAL,
    2.718281828459045
),
(
    -200,
    -500000,
    -987654321098765,
    -99999999.99,
    120.0001,
    -1.414::REAL,
    -1.618033988749895
);
```


你将看到类似如下结果（`id`、`auto_int`、`auto_bigint` 自动递增）：

| id | tiny_int | normal_int | big_int          | auto_int | auto_bigint | precise_num | price         | single_float | double_float     |
|----|----------|------------|------------------|----------|-------------|-------------|---------------|--------------|------------------|
| 1  | 100      | 1000000    | 123456789012345  | 1        | 1           | 12345678.90 | 12345678.9999 | 3.14159      | 2.718281828459045 |
| 2  | -200     | -500000    | -987654321098765 | 2        | 2           | -99999999.99| 120.0001        | -1.414       | -1.618033988749895 |

---

## 二、**字符类型（Character Types）**

| 类型 | 说明 |
|------|------|
| `CHAR(n)` | 定长字符串，不足补空格，最大 1GB |
| `VARCHAR(n)` | 变长字符串，最大长度 n |
| `TEXT` | 无长度限制的变长字符串（推荐使用） |

> ✅ 实际开发中通常直接用 `TEXT`，性能与 `VARCHAR` 相当，且更灵活。

### SQL 示例

```PostgreSQL
-- 1. 第一步：创建表
CREATE TABLE char_types_demo (
    id          SERIAL PRIMARY KEY,
    code_fixed  CHAR(6),            -- 固定长度6字符，不足补空格
    name_limited VARCHAR(50),       -- 最多50个字符
    description TEXT                -- 任意长度文本
);

-- 2. 第二步：添加注释
-- 表注释
COMMENT ON TABLE char_types_demo IS '字符类型演示表：CHAR, VARCHAR, TEXT';

-- 字段注释
COMMENT ON COLUMN char_types_demo.id IS '主键';
COMMENT ON COLUMN char_types_demo.code_fixed IS '固定6位编码（如国家代码、状态码），不足补空格';
COMMENT ON COLUMN char_types_demo.name_limited IS '名称，最多50个字符';
COMMENT ON COLUMN char_types_demo.description IS '详细描述，无长度限制';

-- 3. 第三步：插入示例数据
INSERT INTO char_types_demo (code_fixed, name_limited, description) VALUES
('CN',      '中国',           '中华人民共和国，位于东亚，首都北京。'),
('USA',     '美国',           '美利坚合众国，位于北美洲，首都华盛顿特区。'),
('FR',      '法国',           '法兰西共和国，位于西欧，首都巴黎。'),
('JP',      '日本',           '日本国，位于东亚，首都东京。'),
('DEU',     '德国',           '德意志联邦共和国，位于中欧，首都柏林。'),
('BR',      '巴西',           '巴西联邦共和国，南美洲最大国家，首都巴西利亚。'),
('AUS',     '澳大利亚',        '位于大洋洲，首都堪培拉，以自然景观和野生动物闻名。'),
('IDN',     '印度尼西亚',      '东南亚国家，由17000多个岛屿组成，首都雅加达。'),
('CA',      '加拿大',          '北美洲国家，面积世界第二，首都渥太华。'),
('IN',      '印度',            '南亚国家，人口超14亿，首都新德里。');
```

---

## 三、**日期/时间类型（Date/Time Types）**

| 类型 | 说明 | 示例 |
|------|------|------|
| `DATE` | 日期（年月日） | `'2025-11-10'` |
| `TIME [WITHOUT TIME ZONE]` | 时间（时分秒[.微秒]） | `'14:30:00'` |
| `TIME WITH TIME ZONE` / `TIMETZ` | 带时区的时间 | `'14:30:00+08'` |
| `TIMESTAMP [WITHOUT TIME ZONE]` | 日期+时间 | `'2025-11-10 14:30:00'` |
| `TIMESTAMP WITH TIME ZONE` / `TIMESTAMPTZ` | 带时区的日期时间（**推荐存储时间用这个**） | `'2025-11-10 14:30:00+08'` |
| `INTERVAL` | 时间间隔 | `'2 days 3 hours'` |

> ⚠️ `TIMESTAMPTZ` 并不“存储”时区，而是将输入时间转换为 UTC 存储，查询时按当前会话时区显示。

### SQL 示例

```PostgreSQL
-- 1. 创建表：包含所有主要日期/时间类型
CREATE TABLE datetime_demo (
    id                SERIAL PRIMARY KEY,

    event_date        DATE,                          -- 仅日期
    start_time        TIME WITHOUT TIME ZONE,        -- 仅时间（无时区）
    end_time_tz       TIME WITH TIME ZONE,           -- 带时区的时间

    created_at        TIMESTAMP WITHOUT TIME ZONE,   -- 日期+时间（无时区）
    updated_at_tz     TIMESTAMP WITH TIME ZONE,      -- 带时区的日期时间（推荐用于记录时间）

    duration          INTERVAL                       -- 时间间隔
);

-- 2. 添加表和字段注释
-- 表注释
COMMENT ON TABLE datetime_demo IS '日期/时间类型演示表';

-- 字段注释
COMMENT ON COLUMN datetime_demo.id IS '主键';
COMMENT ON COLUMN datetime_demo.event_date IS '事件发生日期（年月日）';
COMMENT ON COLUMN datetime_demo.start_time IS '开始时间（本地时间，无时区）';
COMMENT ON COLUMN datetime_demo.end_time_tz IS '结束时间（带时区，如 18:00+08）';
COMMENT ON COLUMN datetime_demo.created_at IS '创建时间（无时区，不推荐用于跨时区系统）';
COMMENT ON COLUMN datetime_demo.updated_at_tz IS '更新时间（带时区，推荐存储用）';
COMMENT ON COLUMN datetime_demo.duration IS '持续时间（如 ''1 day 2 hours 30 mins''）';

-- 3. 插入示例数据
INSERT INTO datetime_demo (
    event_date,
    start_time,
    end_time_tz,
    created_at,
    updated_at_tz,
    duration
) VALUES
(
    '2025-11-10',                     -- DATE
    '09:00:00',                       -- TIME
    '18:00:00+08',                    -- TIME WITH TIME ZONE
    '2025-11-10 08:30:00',           -- TIMESTAMP
    '2025-11-10 18:45:00+08',        -- TIMESTAMPTZ
    '9 hours'                         -- INTERVAL
),
(
    '2025-12-25',
    '10:15:30',
    '17:45:00+00',                    -- UTC 时间
    '2025-12-25 10:15:30',
    '2025-12-25 17:45:00+00',
    '7 hours 30 minutes'
),
(
    '2026-01-01',
    '00:00:00',
    '23:59:59.999999+08',
    '2026-01-01 00:00:00',
    NOW(),                            -- 使用当前带时区时间
    '1 day -1 second'                 -- 也可以写成 '23:59:59'
);
```

---

## 四、**布尔类型（Boolean）**

| 类型 | 值 |
|------|----|
| `BOOLEAN` / `BOOL` | `TRUE`, `FALSE`, `NULL`；也接受 `'t'/'f'`, `'yes'/'no'`, `1/0` 等输入 |

### SQL 示例

```PostgreSQL
-- 1. 创建表（含布尔字段）
CREATE TABLE boolean_demo (
    id                SERIAL PRIMARY KEY,

    is_active         BOOLEAN,          -- 是否激活
    has_license       BOOL,             -- 是否有许可证（BOOL 是 BOOLEAN 的别名）
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否已验证，默认 false
    newsletter_opt_in BOOLEAN,          -- 是否订阅邮件
    dark_mode_enabled BOOLEAN           -- 是否启用深色模式
);

-- 2. 添加表和字段注释
-- 表注释
COMMENT ON TABLE boolean_demo IS '布尔类型（Boolean）演示表';

-- 字段注释
COMMENT ON COLUMN boolean_demo.id IS '主键';
COMMENT ON COLUMN boolean_demo.is_active IS '用户是否处于激活状态';
COMMENT ON COLUMN boolean_demo.has_license IS '是否持有有效许可证';
COMMENT ON COLUMN boolean_demo.is_verified IS '身份是否已验证（默认未验证）';
COMMENT ON COLUMN boolean_demo.newsletter_opt_in IS '是否同意接收新闻邮件';
COMMENT ON COLUMN boolean_demo.dark_mode_enabled IS 'UI 是否启用深色模式';

-- 3. 插入多样化的布尔数据
INSERT INTO boolean_demo (
    is_active,
    has_license,
    is_verified,
    newsletter_opt_in,
    dark_mode_enabled
) VALUES
-- 标准写法
(TRUE,  TRUE,  TRUE,  TRUE,  FALSE),

-- 字符串形式（小写/大写均可）
('true', 'yes', '1', 'on', 'false'),

-- 简写形式
('t', 'y', '1'::BOOLEAN, 'f', 'n'),

-- 混合 NULL（注意 is_verified 不能为 NULL，因为 NOT NULL）
(NULL, NULL, FALSE, NULL, TRUE),

-- 全默认（只指定部分字段）
(DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT);  -- 实际只有 is_verified 有 DEFAULT

-- 4. 查询验证数据
SELECT
    id,
    is_active,
    has_license,
    is_verified,
    newsletter_opt_in,
    dark_mode_enabled
FROM boolean_demo;
```

---

## 五、**枚举类型（ENUM）**

用户自定义的有限字符串集合：
```PostgreSQL
CREATE TYPE mood AS ENUM ('sad', 'ok', 'happy');
CREATE TABLE person (name TEXT, current_mood mood);
```

### SQL 示例

```PostgreSQL
-- 1. 定义一个名为 user_status 的枚举类型
CREATE TYPE user_status AS ENUM (
    'pending',      -- 待激活
    'active',       -- 已激活
    'suspended',    -- 已暂停
    'banned'        -- 已封禁
);

-- 2. 创建使用 ENUM 的表
CREATE TABLE users_enum_demo (
    id         SERIAL PRIMARY KEY,
    username   TEXT NOT NULL UNIQUE,
    status     user_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 添加表和字段注释
-- 表注释
COMMENT ON TABLE users_enum_demo IS '使用 ENUM 枚举类型的用户表示例';

-- 字段注释
COMMENT ON COLUMN users_enum_demo.id IS '用户ID，主键';
COMMENT ON COLUMN users_enum_demo.username IS '用户名，唯一';
COMMENT ON COLUMN users_enum_demo.status IS '用户状态，使用 user_status 枚举类型';
COMMENT ON COLUMN users_enum_demo.created_at IS '注册时间';

-- 4. 插入合法的枚举数据
INSERT INTO users_enum_demo (username, status) VALUES
('alice', 'active'),
('bob', 'pending'),
('charlie', 'suspended'),
('diana', 'banned'),
('eve', 'active');

-- 5. 按枚举定义顺序排序
SELECT username, status
FROM users_enum_demo
ORDER BY status;
```

---

## 六、**几何类型（Geometric Types）**
ˆ
用于空间数据（但复杂 GIS 推荐用 PostGIS 扩展）：
- `POINT`：点 `(x, y)`
- `LINE`, `LSEG`：线段
- `BOX`：矩形
- `PATH`, `POLYGON`, `CIRCLE` 等

---

## 七、**网络地址类型**

| 类型 | 说明 |
|------|------|
| `INET` | IPv4 或 IPv6 地址（可带子网掩码） | `'192.168.1.1/24'` |
| `CIDR` | 网络地址（严格格式） | `'192.168.1.0/24'` |
| `MACADDR` | MAC 地址 | `'08:00:2b:01:02:03'` |
| `MACADDR8` | 8字节 MAC 地址（PostgreSQL 10+） |

---

## 八、**JSON 类型（强大特性！）**

| 类型 | 说明 |
|------|------|
| `JSON` | 存储原始 JSON 文本（每次读取需解析） |
| `JSONB` | **二进制格式存储 JSON**（支持索引、高效查询，**推荐使用**） |

✅ 支持丰富的操作符和函数：
```PostgreSQL
SELECT '{"name": "Alice", "age": 30}'::jsonb ->> 'name'; -- 返回 'Alice'
```

---

## 九、**数组类型（Array）**

PostgreSQL 原生支持**任意类型的数组**：
```PostgreSQL
CREATE TABLE sal_emp (
    name TEXT,
    pay_by_quarter INTEGER[],
    schedule TEXT[][]
);
INSERT INTO sal_emp VALUES ('Bill', '{10000, 10000, 10000, 10000}', '{{"meeting", "lunch"}, {"training", "presentation"}}');
```

---

## 十、**范围类型（Range Types）**

表示一个区间（常用于时间、价格区间等）：
| 类型 | 对应元素类型 |
|------|-------------|
| `int4range` | `INTEGER` |
| `int8range` | `BIGINT` |
| `numrange` | `NUMERIC` |
| `tsrange` | `TIMESTAMP` |
| `tstzrange` | `TIMESTAMPTZ` |
| `daterange` | `DATE` |

示例：
```PostgreSQL
SELECT int4range(10, 20) @> 15; -- true（15 是否在 [10,20) 区间内）
```

---

## 十一、**对象标识符类型（OID Types）**

用于系统内部（如大对象、表 OID），一般应用开发中**不建议使用**。

---

## 十二、**UUID 类型**

需要启用 `uuid-ossp` 扩展才能生成 UUID：
```PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT);
```

---

## 十三、**XML 类型**

支持 XML 数据存储与查询（需编译时启用）：
```PostgreSQL
SELECT '<a>foo</a>'::xml;
```

---

## 十四、**自定义类型**

可通过 `CREATE TYPE` 创建复合类型或域（DOMAIN）：
```PostgreSQL
CREATE TYPE address AS (
    street TEXT,
    city TEXT,
    zip_code TEXT
);

CREATE DOMAIN positive_int AS INTEGER CHECK (VALUE > 0);
```

---

## 总结：常用推荐类型

| 用途 | 推荐类型 |
|------|--------|
| 主键 | `BIGINT` 或 `UUID` |
| 金额 | `NUMERIC` |
| 文本 | `TEXT` |
| 时间 | `TIMESTAMPTZ` |
| JSON 数据 | `JSONB` |
| IP 地址 | `INET` |
| 枚举值 | `ENUM` 或 `TEXT`（简单场景） |

---

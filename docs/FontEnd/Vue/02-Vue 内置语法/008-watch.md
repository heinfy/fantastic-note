---
id: watch
title: 选项式 API：watch
keywords: [Vue]
tags:
  - Vue
hide_title: true
sidebar_position: 8
description: watch
custom_edit_url: null
---

# 选项式 API：watch

`watch` 选项适用于 Vue 2 与 Vue 3 的选项式 API。组合式 API 的用法见 [watch](../007-watch.md)。

## 回调、方法名与配置对象

```js
export default {
  data() {
    return { count: 0, title: '', query: '', user: { name: 'Alice' } };
  },
  watch: {
    count(value, oldValue) {
      console.log(value, oldValue);
    },
    title: 'onTitleChange',
    query: {
      immediate: true,
      handler(value) { console.log('查询：', value); }
    },
    'user.name'(value) {
      console.log('姓名：', value);
    }
  },
  methods: {
    onTitleChange(value) { console.log('标题：', value); }
  }
};
```

侦听嵌套路径可使用字符串 key；侦听整个对象内部的变化可配置 `deep: true`。`immediate` 在建立侦听器时执行一次，不表示监听 data 的每次初始化赋值。

## 同一属性的多个回调

同一 key 不要重复声明；需要多个处理函数时传入数组。

```js
watch: {
  count: [
    'onCountChange',
    function logCount(value) { console.log(value); },
    { handler: 'initializeCount', immediate: true }
  ]
}
```

上面是组件 watch 选项的片段，字符串形式需对应组件 methods。动态创建的侦听器可用 `const stop = this.$watch('count', callback)`，不再需要时调用 `stop()`。

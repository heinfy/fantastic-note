---
sidebar_position: 2
---

# Vue 与 iframe 双向通信

同源页面可以直接访问 iframe 的 DOM；跨源通信可使用 `postMessage()`，无需跨源读取 DOM。下面以 Vue 3 和同源 `public/iframe.html` 为例。

## 父页面

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const iframe = ref(null);
const iframeOrigin = window.location.origin;
const reply = ref('');

function send() {
  iframe.value?.contentWindow?.postMessage({
    type: 'sendDataToIframe', data: { name: '父页面数据' }
  }, iframeOrigin);
}
function receive(event) {
  if (event.origin !== iframeOrigin || event.source !== iframe.value?.contentWindow) return;
  if (event.data?.type === 'sendIframeDataToPage') reply.value = event.data.data;
}
onMounted(() => window.addEventListener('message', receive));
onUnmounted(() => window.removeEventListener('message', receive));
</script>

<template>
  <iframe ref="iframe" src="/iframe.html" title="通信示例" @load="send" />
  <p>iframe 返回：{{ reply }}</p>
</template>
```

监听消息应绑定当前页面的 window，不是在 iframe window 上注册自定义事件。

## iframe 页面

```html
<!-- public/iframe.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head><meta charset="UTF-8" /><title>iframe 通信</title></head>
  <body>
    <p id="message"></p>
    <button id="send">回复父页面</button>
    <script>
      const parentOrigin = location.origin;
      window.addEventListener('message', event => {
        if (event.origin !== parentOrigin || event.source !== parent) return;
        if (event.data?.type === 'sendDataToIframe') {
          document.getElementById('message').textContent = event.data.data.name;
        }
      });
      document.getElementById('send').addEventListener('click', () => {
        parent.postMessage({ type: 'sendIframeDataToPage', data: 'iframe 数据' }, parentOrigin);
      });
    </script>
  </body>
</html>
```

跨源使用时，将 `iframeOrigin` 和 `parentOrigin` 分别设置为已知的对方 origin，并保持 `origin` 与 `source` 检查。目标是否允许被 iframe 嵌入还受页面的响应头限制。

参考：[window.postMessage](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage)。

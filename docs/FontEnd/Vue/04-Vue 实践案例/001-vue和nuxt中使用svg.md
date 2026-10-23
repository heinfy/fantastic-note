---
sidebar_position: 1
---

# Vue 2 / Nuxt 2 使用 SVG 图标

本案例使用 webpack 与 `svg-sprite-loader`，适用于 Vue CLI 和 Nuxt 2。两个环境共用 SvgIcon 组件，只需分别配置构建规则与入口；Vue 3 + Vite 不能直接使用 `require.context()`。

## 安装依赖与共用组件

```bash
npm install svg-sprite-loader
```

```vue
<!-- components/SvgIcon.vue -->
<template>
  <div v-if="isExternal" class="svg-icon external-icon" :style="externalStyle" v-on="$listeners" />
  <svg v-else class="svg-icon" aria-hidden="true" v-on="$listeners">
    <use :xlink:href="`#icon-${iconClass}`" />
  </svg>
</template>

<script>
export default {
  props: { iconClass: { type: String, required: true } },
  computed: {
    isExternal() { return /^https?:/.test(this.iconClass); },
    externalStyle() {
      const mask = `url(${this.iconClass}) no-repeat 50% 50%`;
      return { mask, WebkitMask: mask };
    }
  }
};
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
.external-icon {
  background-color: currentColor;
  mask-size: contain;
  -webkit-mask-size: contain;
}
</style>
```

本地图标用 sprite 的 symbol id；外部 SVG 用 CSS mask。图标尺寸与颜色由外部 CSS 控制，`class` 可直接传入组件。

## Vue CLI 配置

图标目录使用 `src/icons/svg/`，例如 `src/icons/svg/button.svg`。

```js
// vue.config.js
const path = require('path');
const iconsDir = path.resolve(__dirname, 'src/icons/svg');

module.exports = {
  chainWebpack(config) {
    config.module.rule('svg').exclude.add(iconsDir);
    config.module.rule('icons')
      .test(/\.svg$/)
      .include.add(iconsDir).end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({ symbolId: 'icon-[name]' });
  }
};
```

```js
// src/icons/index.js
import Vue from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';

Vue.component('svg-icon', SvgIcon);
const icons = require.context('./svg', false, /\.svg$/);
icons.keys().forEach(icons);
```

在 `src/main.js` 导入 `@/icons`。

## Nuxt 2 配置

图标目录使用 `assets/icons/svg/`，共用组件放在 `components/SvgIcon.vue`。

```js
// nuxt.config.js
const path = require('path');
const iconsDir = path.resolve(__dirname, 'assets/icons/svg');

module.exports = {
  build: {
    extend(config) {
      const svgRule = config.module.rules.find(rule =>
        rule.test instanceof RegExp && rule.test.test('.svg')
      );
      if (svgRule) {
        const excluded = svgRule.exclude ? [].concat(svgRule.exclude) : [];
        svgRule.exclude = [...excluded, iconsDir];
      }
      config.module.rules.push({
        test: /\.svg$/,
        include: [iconsDir],
        use: [{ loader: 'svg-sprite-loader', options: { symbolId: 'icon-[name]' } }]
      });
    }
  },
  plugins: [{ src: '@/plugins/svg-icon.js', mode: 'client' }]
};
```

```js
// plugins/svg-icon.js
import Vue from 'vue';
import SvgIcon from '@/components/SvgIcon.vue';

Vue.component('svg-icon', SvgIcon);
const icons = require.context('@/assets/icons/svg', false, /\.svg$/);
icons.keys().forEach(icons);
```

## 使用

```vue
<svg-icon icon-class="button" />
<svg-icon icon-class="https://example.com/icon.svg" class="large-icon" />
```

Nuxt 2 中插件仅在客户端注册，使用位置可加 `<client-only>` 包裹。上述 id 由文件名生成，需保证图标文件名唯一。

参考：[SVG Icon](https://panjiachen.github.io/vue-element-admin-site/feature/component/svg-icon.html)。

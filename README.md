# Fantastic Note

基于 Docusaurus 构建的个人前端技术知识库，整理了 TypeScript、React、JavaScript、Vue、CSS、Electron、VSCode 插件、Python、Linux 等方向的笔记和实践记录。

## 功能

- 中文站点界面与内容
- 多侧边栏文档结构，按技术域拆分
- Markdown 文档与目录自动生成
- Algolia 站内搜索
- 图片缩放查看
- 明暗主题切换，跟随系统偏好
- 博客功能（RSS / Atom）

## 目录结构

```text
.
├── blog/                 # 博客文章
├── docs/                 # 技术笔记
│   ├── Electron/
│   ├── FontEnd/
│   ├── Other/
│   ├── Python/
│   └── VSCode-Plugin/
├── src/
│   ├── components/
│   ├── css/
│   └── pages/
├── static/img/           # 图片资源
├── docusaurus.config.ts  # Docusaurus 配置
├── sidebars.ts           # 侧边栏配置
└── package.json
```

## 快速开始

要求 `Node.js >= 24`。

```bash
npm install
npm run start
```

## 常用命令

```bash
npm run build       # 构建静态站点
npm run serve       # 本地预览构建结果
npm run typecheck   # TypeScript 类型检查
npm run clear       # 清理 Docusaurus 缓存
npm run deploy       # 部署站点
```

## 搜索配置

Algolia 配置默认写在 `docusaurus.config.ts` 中，如需替换为自己的索引，可通过环境变量覆盖：

```bash
ALGOLIA_APP_ID=xxx \
ALGOLIA_API_KEY=xxx \
ALGOLIA_INDEX_NAME=xxx \
npm run build
```
## 简历样式来源

简历页面 `/resume` 的样式基于 [Start Bootstrap Resume](https://github.com/StartBootstrap/startbootstrap-resume) 模板，并在此基础上适配 Docusaurus 和 React，保留侧栏导航与响应式布局。

## 相关链接

- [Docusaurus 文档](https://docusaurus.io/zh-CN/docs)
- [Algolia 搜索](https://docsearch.algolia.com/)

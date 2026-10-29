import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import type { ZoomConfig } from 'docusaurus-plugin-medium-zoom';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Fantastic Note',
  tagline: '一个专注于前端技术的知识库，记录前端开发中遇到的各种问题和解决方案。',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://fantastic-note.vercel.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'heinfy', // Usually your GitHub org/user name.
  projectName: 'fantastic-note', // Usually your repo name.

  onBrokenLinks: 'throw',

  // 新增 markdown 配置块
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn', // 从顶层移动到这里
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/heinfy/fantastic-note/tree/main',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/heinfy/fantastic-note/tree/main',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    'docusaurus-plugin-medium-zoom', // 添加插件
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',

    colorMode: {
      // 1. 启用尊重系统偏好
      respectPrefersColorScheme: true,

      // 2. 默认模式可以设为 'light' 或 'dark'，但上面为 true 时，首次访问会跟随系统
      defaultMode: 'light',

      // 3. 确保没有禁用切换按钮
      disableSwitch: false,
    },

    zoom: {
      selector: '.markdown img', // 默认选择器，匹配 Markdown 中的图片
      background: {
        light: 'rgb(255, 255, 255)', // 浅色模式背景
        dark: 'rgb(50, 50, 50)', // 深色模式背景
      },
      config: {
        // 可选：传递 medium-zoom 的原生选项
        // 例如：scrollOffset: 10, margin: 20
      },
    } satisfies ZoomConfig,

    navbar: {
      title: 'Fantastic Note',
      logo: {
        alt: 'Fantastic Note Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'reactSidebar',
          label: 'React',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'electronSidebar',
          label: 'Electron',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'vscodePluginSidebar',
          label: 'VSCode 插件',
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'pySidebar',
          label: 'Python',
        },
        {
          type: 'dropdown',
          position: 'left',
          label: '更多',
          items: [
            {
              type: 'docSidebar',
              sidebarId: 'jsSidebar',
              label: 'JavaScript',
            },
            {
              type: 'docSidebar',
              sidebarId: 'vueSidebar',
              label: 'Vue',
            },
            {
              type: 'docSidebar',
              sidebarId: 'linuxSidebar',
              label: 'Linux',
            },
            {
              type: 'docSidebar',
              sidebarId: 'tsSidebar',
              label: 'TypeScript',
            },
            {
              type: 'docSidebar',
              sidebarId: 'hcSidebar',
              label: 'CSS',
            },
            {
              type: 'docSidebar',
              sidebarId: 'otherSidebar',
              label: '其他',
            },
          ],
        },
        // { to: '/blog', label: '博客', position: 'right' },
        {
          href: 'https://github.com/heinfy/fantastic-note',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          label: '我的主页',
          href: 'https://heinfy.top',
        },
        {
          label: '我的简历',
          to: '/resume',
        },
        {
          label: '色彩游乐场',
          to: '/playground/colors',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/heinfy',
        },
      ],
      copyright: `© ${new Date().getFullYear()} fantastic-note · Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID || 'D6L79QDWQN',
      apiKey: process.env.ALGOLIA_API_KEY || 'ae8d94a7792b678a590640f3479dff08',
      indexName: process.env.ALGOLIA_INDEX_NAME || '爬虫一号',
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: '一直走的技术博客',
  tagline: 'Include React, Vue.js, Typescript, Nodejs, Python, Docker ...',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true // Improve compatibility with the upcoming Docusaurus v4
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
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans']
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/heinfy/fantastic-note/tree/main'
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/heinfy/fantastic-note/tree/main',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn'
        },
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Fantastic',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg'
      },
      items: [
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'tsSidebar',
          label: 'TypeScript'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'reactSidebar',
          label: 'React'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'jsSidebar',
          label: 'JavaScript'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'vueSidebar',
          label: 'Vue'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'liunxSidebar',
          label: 'Liunx'
        },
        {
          type: 'docSidebar',
          sidebarId: 'dockerSidebar',
          position: 'left',
          label: 'Docker'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'hcSidebar',
          label: 'HTML和CSS'
        },
        {
          type: 'docSidebar',
          position: 'left',
          sidebarId: 'otherSidebar',
          label: '其他'
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '教程'
        },
        { to: '/blog', label: '博客', position: 'left' },
        {
          href: 'https://github.com/heinfy/fantastic-note',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: 'docusaurus 教程',
              to: '/docs/Tutorial/intro'
            }
          ]
        },
        {
          title: '关于我',
          items: [
            {
              label: '我的主页',
              href: 'https://heinfy.top'
            },
            {
              label: 'react-admin-app',
              href: 'https://github.com/heinfy/react-admin-app'
            },
            {
              label: 'console-view',
              href: 'https://github.com/heinfy/console-view'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: '博客教程',
              to: '/blog'
            },
            {
              label: '我的简历',
              href: 'https://resume.heinfy.top/'
            },
            {
              label: 'GitHub',
              href: 'https://github.com/heinfy'
            }
          ]
        }
      ],
      copyright: `Copyright © ${new Date().getFullYear()} fantastic-note, Inc. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula
    },
    algolia: {
      appId: process.env.ALGOLIA_APP_ID || 'D6L79QDWQN',
      apiKey: process.env.ALGOLIA_API_KEY || 'ae8d94a7792b678a590640f3479dff08',
      indexName: process.env.ALGOLIA_INDEX_NAME || '爬虫一号'
    }
  } satisfies Preset.ThemeConfig
};

export default config;

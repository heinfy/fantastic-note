// Content migrated from resume-main/src/pug/index.pug.
// Edit the data here to update the published resume.

export type ResumeSectionId = 'about' | 'skills' | 'experience' | 'project' | 'advantage';

export type ResumeIconName = 'internetExplorer' | 'microblog' | 'github' | 'markdown' | 'check' | 'splotch' | 'bars';

export type ResumeEntry = {
  title: string;
  subtitle: string;
  period: string;
  paragraphs: string[];
};

export type ResumeProject = ResumeEntry & {
  description: { text: string; href?: string }[];
};

export type ResumeData = {
  sections: { id: ResumeSectionId; label: string }[];
  profile: {
    name: string;
    title: string;
    details: { label: string; value: string; href?: string }[][];
    links: { label: string; href: string; title: string; icon: ResumeIconName }[];
    welcome: string;
  };
  skillsHeading: string;
  skills: string[];
  experience: ResumeEntry[];
  projects: ResumeProject[];
  workLabel: string;
  assessment: string[];
};

export const resumeData: ResumeData = {
  sections: [
    {
      id: 'about',
      label: '关于我',
    },
    {
      id: 'skills',
      label: '职业技能',
    },
    {
      id: 'experience',
      label: '工作经历',
    },
    {
      id: 'project',
      label: '项目经验',
    },
    {
      id: 'advantage',
      label: '自我评价',
    },
  ],
  profile: {
    name: '候飞',
    title: ' 前端工程师',
    details: [
      [
        {
          label: '电话：',
          value: '13261351763（同微信）',
          href: 'tel:13261351763',
        },
        {
          label: '邮箱：',
          value: 'houfei.fe@foxmail.com',
          href: 'mailto:houfei.fe@foxmail.com',
        },
        {
          label: '现居地：',
          value: '北京',
        },
      ],
      [
        {
          label: '年龄：',
          value: '31',
        },
        {
          label: '籍贯：',
          value: '河北张家口',
        },
        {
          label: '工作年限：',
          value: '9年',
        },
      ],
      [
        {
          label: '毕业院校：',
          value: '唐山学院',
        },
        {
          label: '专业：',
          value: '机械设计制造及其自动化',
        },
        {
          label: '学历：',
          value: '统招本科',
        },
      ],
      [
        {
          label: '就读时间：',
          value: '2013.9-2017.6',
        },
      ],
    ],
    links: [
      {
        label: '我的主页：',
        href: 'https://heinfy.top/',
        title: 'https://heinfy.top/',
        icon: 'internetExplorer',
      },
      {
        label: '简历.pdf：',
        href: 'https://www.qmjianli.com/cvs/22384M52GIF5P56',
        title: '我的简历文档',
        icon: 'markdown',
      },
    ],
    welcome: '求职ing，欢迎查看我的简历',
  },
  skillsHeading: '工作能力',
  skills: [
    '熟练掌握 HTML、CSS 及 JavaScript 前端技术，掌握 TypeScript 的语法和特性；',
    '熟练掌握 React、Vue 等前端框架，熟悉其核心概念、生命周期、状态管理；',
    '熟练使用 Electron 开发跨平台桌面应用，掌握 VSCode 插件开发、调试与发布流程；',
    '熟练运用 Vibe Coding，借助 Codex、Cursor 等AI工具，显著提升开发效率；',
    '熟练掌握前端工程化与大型应用开发，掌握 Docker 与 CI/CD 自动化构建部署；',
    '熟练掌握移动端 Hybrid 混合开发，熟悉 WebView 集成与 JSBridge 通信，保障原生与 H5 页面的高效协同；',
    '熟悉小程序、NodeJS、Python 服务端生态，能够快速实现后端服务。',
  ],
  experience: [
    {
      title: '软件开发工程师',
      subtitle: '润和软件',
      period: '2026.03 - 2026.11',
      paragraphs: [
        '1、参与 JoyAgent-Work 桌面端和 Web 的开发工作；',
        '2、参与 JoyCode IDE、Vscode 插件以及 Team Studio 平台开发工作；',
        '3、负责 JoyCode 客户线上问题的根因分析与解决。',
      ],
    },
    {
      title: '前端开发工程师',
      subtitle: '中软国际',
      period: '2024.08 - 2025.12',
      paragraphs: [
        '1、参与大模型前端页面的开发工作，基于开源项目二次开发；',
        '2、参与 ASK 容器服务平台、企业级配置管理中心项目的前端技术选型等工作；',
        '3、参与前端项目的 CI/CD 自动化构建、测试与部署；',
        '4、参与项目 Sentry 监控、Zitadel SSO 身份访问验证的等开发任务。',
      ],
    },
    {
      title: '完美世界',
      subtitle: '前端/鸿蒙开发工程师',
      period: '2021.02 - 2024.05',
      paragraphs: [
        '1、参与公司内部 CRM 系统以及教务系统开发工作，撰写相关的技术文档；',
        '2、参与完美世界教育 ToB、ToC 在线学习平台（PC、小程序端）开发工作，从0到1实现所有功能；',
        '3、参与鸿蒙App的方案制定，制定桥方法，搭建项目框架，开发业务功能模块。',
      ],
    },
    {
      title: '学霸君',
      subtitle: 'web 前端工程师',
      period: '2017.09 - 2020.12',
      paragraphs: [
        '1、参与优学课堂的需求分析，负责活动页、广告加盟以及运营平台的开发工作；',
        '2、依据业务需求，实现资料分享小程序、公众号相关功能的开发，输出稳定、可靠的前端代码。',
      ],
    },
  ],
  projects: [
    {
      title: '京能“擎睿”燃机大模型',
      subtitle: '技术栈：svelte，nextjs，react，docker',
      period: '2025.09 - 2025.12',
      paragraphs: [
        '1、基于 open-webui 二次开发，实现知识库，智能问数，报表生成等核心功能，',
        '2、基于 LabelLLM 开源标注平台二次开发，增加团队长的角色，完成供应商端、管理端不同角色维度的标注统计；',
        '3、基于 Easy Dataset 二次开发，取消上传文件大小的限制，并添加数据库字段，用来控制模型是否开启思考模式；优化导出带有上下文的高质量训练数据；',
        '4、基于 docker 实现以上项目的容器部署和数据卷挂载；',
        '5、基于 svelte 框架开发大屏展示页面；',
      ],
      description: [
        {
          text: '项目描述：京能“擎睿”燃机大模型为京能集团的燃机大模型，集成垂类时序、问答知识库、智能问数和报表生成等核心能力，面向燃机运行、检修、设计等专业人员，提供智能化辅助决策支持。',
        },
      ],
    },
    {
      title: '灵均投资配置管理平台',
      subtitle: '技术栈：Nextjs、ORM、Apollo',
      period: '2025.01 - 2025.08',
      paragraphs: [
        '1、负责集成企业级 SSO 登录；',
        '2、根据项目需求二次封装 Monaco 和 Excel 编辑器；',
        '3、基于 Redux 实现全局状态管理以及添加异步请求；',
        '4、基于 Prisma ORM 工具开发系统的 open API；',
        '5、优化开发体验，集成 ESLint/Prettier，添加 husky，保证代码规范和质量。',
      ],
      description: [
        {
          text: '项目描述：该平台是基于开源 Apollo 项目二次开发，采用 Nextjs 技术栈。该平台能够集中化管理应用不同环境、不同集群的配置，配置修改后能够实时推送到应用端，并且具备规范的权限、流程控制等特性。',
        },
      ],
    },
    {
      title: 'ASK 容器服务平台',
      subtitle: '技术栈：Nextjs、Docker',
      period: '2024-08 - 2025-01',
      paragraphs: [
        '1、配置 CI/CD 自动化部署流水线，基于 Docker 镜像实现代码从提交到上线全流程自动化；',
        '2、为平台实现了基于权限的路由控制，并为全站添加国际化；',
        '3、采用 Echart 实现数据可视化，展示柱状图、饼图等图表；',
      ],
      description: [
        {
          text: '项目描述：该项目为 ASK 集群中的资源、任务等内容提供前端可视化界面。该平台提供了包括任务列表、虚拟机、数据集、Docker 镜像等内容的管理工作。',
        },
      ],
    },
    {
      title: 'CRM 系统',
      subtitle: '技术栈：webpack、react、typescript、ant-design',
      period: '2021.02 - 2024.05',
      paragraphs: [
        '1、负责功能权限的开发，实现基于 RBAC 权限控制，对路由、按钮实现权限控制；',
        '2、基于百度云对象存储和 CDN 实现文件的上传功能，添加鉴权访问资源以及图片压缩访问；',
        '3、负责报名审批，财务审核流程的前端实现；实现了审批发起，审核、驳回等相关功能，以及相应组件的优化工作；',
        '4、完成系统的打包优化，通过 dll 分离第三方类库，将 css 等资源在打包过程中上传到对象存储，并在 HTML 自动添加 CDN 引用。',
      ],
      description: [
        {
          text: '项目描述：完美世界职业教育系统是完美世界教育为内部人员提供的在线业务平台。实现线下流程线上化，包括一整套招生流程，从线索到客户，报名审批，以及合同签约、财务审核、销售绩效管理、信息共享平台、BI统计报表等。',
        },
      ],
    },
    {
      title: '像素种子慕课网',
      subtitle: '技术栈：vuejs、nuxtjs、小程序、view design',
      period: '2021.09 - 2024.05',
      paragraphs: [
        '1、实现问卷模块，基于 form-making 二次开发，将整个功能整合到 TOC 平台，并添加定制化的后端接口交互功能；',
        '2、负责整个系统的视频播放器功能开发，运营端负责课程视频上传到对象存储，以及审核等功能；用户端引入 cyberplayer 播放器，对课程进行逐章节连续播放；根据业务需求，对播放中的课程进行暂停、提供弹窗问答；以及限时试看等功能开发；',
        '3、对接微信公众平台订阅消息，实现开课提醒等方面的订阅功能；',
        '4、负责购课支付、个人中心、订单中心以及营销模块等的功能实现，包括头像上传裁剪、优惠券领取核销等功能；',
        '5、负责课程问答模块的功能实现，实现了评论、回复、点赞、举报等功能；',
      ],
      description: [
        {
          text: '像素种子慕课网',
          href: 'https://www.pixseed.com/',
        },
        {
          text: '是完美世界教育 ToC 线上课平台（PC端，小程序端），对外提供涵盖影视、游戏行业等课程在线播放。用户可以在平台下单购课，直接在平台观看课程。具体业务包括信问卷采集、在线学习、个人中心、课程问答、订单支付等功能。',
        },
      ],
    },
    {
      title: '教务系统',
      subtitle: '技术栈：vuejs, iview',
      period: '2021.02 - 2023.12',
      paragraphs: [
        '1、负责课程、班级、设备等模块的开发工作，包括业务功能迭代和组件结构的优化工作；',
        '2、负责预约模块的开发工作，通过自定义日历组件批量选择日期；',
        '3、负责座位表模块的开发，包括坐位方向调整，位置拖拽交换，座位表打印PDF等功能；',
        '4、负责讲师排期表的开发，从0实现自定义表格，以及对单元格上的绑定的一些列事件进行优化；',
      ],
      description: [
        {
          text: '项目描述：该系统为完美世界教育下的教务管理系统，服务于内部人员，主要用于管理线下课程相关的的各种流程，涵盖了课程管理、班级管理、座位表、讲师排期表，设备管理等功能。',
        },
      ],
    },
    {
      title: '优学课堂公众号',
      subtitle: '技术栈：vuejs',
      period: '2020.05 - 2020.12',
      paragraphs: [
        '1、负责公众号 h5 端优惠券页面的开发工作；',
        '2、负责调取微信\\支付宝支付 api，完成购买优惠券的支付模块；',
        '3、负责券列表的开发工作以及销券时优惠券的互斥逻辑判断；',
        '4、复用并优化了通用组件、新增 pdf 在线预览模块。',
      ],
      description: [
        {
          text: '项目描述：优学课堂是一个在线学习和教学管理的系统，老师、学生以及家长可以在线沟通学习进度和学习情况。',
        },
      ],
    },
  ],
  workLabel: '我的工作：',
  assessment: [
    '学习能力强，对前端技术有浓厚兴趣，对新事物保有好奇心，并能快速适应新环境；',
    '良好的沟通能力和团队协同能力，能与他人合作，共同完成目标；',
    '具有良好的沟通能力、思维逻辑清晰。',
    '具备阅读英文文档的能力。',
  ],
};

import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: '前端体系',
    Svg: require('@site/static/img/feature-stack.svg').default,
    description: (
      <>
        沿 React、TypeScript、JavaScript 与 Vue 分类沉淀，帮助前端开发者按知识脉络持续补齐能力图谱。
      </>
    ),
  },
  {
    title: '桌面开发',
    Svg: require('@site/static/img/feature-desktop.svg').default,
    description: (
      <>
        覆盖 Electron 进程模型、安全桥接与 VS Code 扩展 API，降低桌面端和插件开发的查资料成本。
      </>
    ),
  },
  {
    title: '原理实战',
    Svg: require('@site/static/img/feature-deep.svg').default,
    description: (
      <>
        从 React、Redux 与 V8 原理延伸到性能优化和工程案例，让知识既能解释问题，也能直接落地。
      </>
    ),
  },
  {
    title: '快速检索',
    Svg: require('@site/static/img/feature-search.svg').default,
    description: (
      <>
        通过分栏导航、Algolia 全站搜索和图片放大，快速定位问题答案与关键细节。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--3')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Resume from '@site/src/components/Resume';
import { resumeData } from '@site/src/components/Resume/data';
import type { ReactNode } from 'react';

export default function ResumePage(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const { profile } = resumeData;
  const title = `${profile.name}的简历 | ${siteConfig.title}`;
  const description = `${profile.name}的个人简历：${profile.title}，职业技能、工作经历、项目经验与联系方式。`;
  const canonical = useBaseUrl('/resume', { absolute: true });
  const portrait = useBaseUrl('/resume/profile.jpg', { absolute: true });

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name='description' content={description} />
        <meta name='author' content={profile.name} />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta property='og:type' content='profile' />
        <meta property='og:url' content={canonical} />
        <meta property='og:image' content={portrait} />
        <link rel='canonical' href={canonical} />
      </Head>
      <Resume />
    </>
  );
}

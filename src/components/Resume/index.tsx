import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { resumeData } from './data';
import type { ResumeEntry, ResumeSectionId } from './data';
import ResumeIcon from './ResumeIcon';
import styles from './styles.module.css';

function Entry({ entry, children }: { entry: ResumeEntry; children?: ReactNode }) {
  return (
    <article className={styles.entry}>
      <div className={styles.entryContent}>
        <h3>{entry.title}</h3>
        <div className={styles.subheading}>{entry.subtitle}</div>
        {children}
        <div className={children ? styles.projectParagraphs : undefined}>
          {entry.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
      <div className={styles.period}>{entry.period}</div>
    </article>
  );
}

export default function Resume(): ReactNode {
  const { profile, sections } = resumeData;
  const portrait = useBaseUrl('/resume/profile.jpg');
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<ResumeSectionId>('about');

  useEffect(() => {
    const elements = sections.map(({ id }) => rootRef.current?.querySelector<HTMLElement>(`#${id}`));
    let frame: number | null = null;

    const updateSection = () => {
      frame = null;
      let current: ResumeSectionId = 'about';
      const activationLine = window.innerHeight * 0.6;
      elements.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= activationLine) {
          current = sections[index].id;
        }
      });
      setActiveSection(current);
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateSection);
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', scheduleUpdate);
    };
  }, [sections]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div id='page-top' ref={rootRef} className={styles.page}>
      <a className={styles.skipLink} href='#about'>跳转到简历正文</a>
      <nav
        id='sideNav'
        className={styles.sidebar}
        aria-label='简历章节'
        onKeyDown={(event) => {
          if (event.key === 'Escape' && menuOpen) {
            closeMenu();
            toggleRef.current?.focus();
          }
        }}
      >
        <a className={styles.brand} href='#page-top' onClick={closeMenu} aria-label={`${profile.name}，返回顶部`}>
          <span className={styles.mobileName}>{profile.name}</span>
          <img className={styles.portrait} src={portrait} alt={`${profile.name}的头像`} width={160} height={160} />
        </a>
        <button
          ref={toggleRef}
          type='button'
          className={styles.menuToggle}
          aria-label={menuOpen ? '收起简历导航' : '展开简历导航'}
          aria-controls='navbarResponsive'
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <ResumeIcon name='bars' />
        </button>
        <div id='navbarResponsive' className={`${styles.navigation} ${menuOpen ? styles.navigationOpen : ''}`}>
          <ul className={styles.navigationList}>
            {sections.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={`${styles.navLink} ${activeSection === id ? styles.activeLink : ''}`}
                  aria-current={activeSection === id ? 'location' : undefined}
                  onClick={closeMenu}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <Link to='/' className={styles.backLink}>返回博客</Link>
        </div>
      </nav>

      <main className={styles.content}>
        <section id='about' className={styles.section} aria-labelledby='resume-about-title'>
          <div className={styles.sectionContent}>
            <h1 id='resume-about-title'>{profile.name}<span className={styles.accent}>{profile.title}</span></h1>
            <div className={styles.details}>
              {profile.details.map((row, index) => (
                <div className={styles.detailRow} key={index}>
                  {row.map(({ label, value, href }) => (
                    <div className={styles.detail} key={label}>
                      <span>{label} </span>
                      {href ? <a href={href}>{value}</a> : <span className={styles.accent}>{value}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <hr />
            <div className={styles.socialLinks}>
              {profile.links.map(({ label, href, title, icon }) => (
                <div className={styles.socialLink} key={label}>
                  <span className={styles.subheading}>{label}</span>
                  <a className={styles.socialIcon} href={href} title={title} aria-label={label.replace('：', '')} target='_blank' rel='noopener noreferrer'>
                    <ResumeIcon name={icon} />
                  </a>
                </div>
              ))}
            </div>
            <hr />
            <p className={styles.welcome}>{profile.welcome}</p>
          </div>
        </section>

        <section id='skills' className={styles.section} aria-labelledby='resume-skills-title'>
          <div className={styles.sectionContent}>
            <h2 id='resume-skills-title'>职业技能</h2>
            <div className={styles.subheading}>{resumeData.skillsHeading}</div>
            <ul className={styles.iconList}>
              {resumeData.skills.map((skill) => <li key={skill}><ResumeIcon name='check' />{skill}</li>)}
            </ul>
          </div>
        </section>

        <section id='experience' className={styles.section} aria-labelledby='resume-experience-title'>
          <div className={styles.sectionContent}>
            <h2 id='resume-experience-title'>工作经历</h2>
            {resumeData.experience.map((entry) => <Entry key={`${entry.title}-${entry.period}`} entry={entry} />)}
          </div>
        </section>

        <section id='project' className={styles.section} aria-labelledby='resume-project-title'>
          <div className={styles.sectionContent}>
            <h2 id='resume-project-title'>项目经验</h2>
            {resumeData.projects.map((entry) => (
              <Entry key={entry.title} entry={entry}>
                <div className={styles.projectDescription}>
                  {entry.description.map(({ text, href }, index) => href ? (
                    <a key={index} href={href} target='_blank' rel='noopener noreferrer'>{text}</a>
                  ) : <span key={index}>{text}</span>)}
                </div>
                <div className={styles.workLabel}>{resumeData.workLabel}</div>
              </Entry>
            ))}
          </div>
        </section>

        <section id='advantage' className={styles.section} aria-labelledby='resume-advantage-title'>
          <div className={styles.sectionContent}>
            <h2 id='resume-advantage-title'>自我评价</h2>
            <ul className={`${styles.iconList} ${styles.assessment}`}>
              {resumeData.assessment.map((item) => <li key={item}><ResumeIcon name='splotch' />{item}</li>)}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

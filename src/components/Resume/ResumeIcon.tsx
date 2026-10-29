import type { ReactNode } from 'react';
import type { ResumeIconName } from './data';
import { resumeIcons } from './iconPaths';

export default function ResumeIcon({ name }: { name: ResumeIconName }): ReactNode {
  const { viewBox, path } = resumeIcons[name];
  return (
    <svg viewBox={viewBox} fill='currentColor' aria-hidden='true' focusable='false'>
      <path d={path} />
    </svg>
  );
}

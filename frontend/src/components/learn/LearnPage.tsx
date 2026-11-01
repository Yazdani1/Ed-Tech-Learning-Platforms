'use client';

import { Suspense } from 'react';

import { ShellMessaging } from '@/components/chat/ShellMessaging';

import { LearnPlayer } from './LearnPlayer';
import { LearnSkeleton } from './LearnSkeleton';

import type { LearnArea } from './learn-tabs';
import type { FC } from 'react';

interface LearnPageProps {
  courseId: string;
  area: LearnArea;
}

/**
 * The course player route (student, teacher and admin areas). Suspense: the open tab is kept in the URL.
 * The student player has no shell, so it mounts the live chat/notification updates and the students'
 * floating support chat button itself (hidden for staff), as the old player did.
 */
export const LearnPage: FC<LearnPageProps> = ({ courseId, area }) => (
  <>
    <Suspense fallback={<LearnSkeleton />}>
      <LearnPlayer courseId={courseId} area={area} />
    </Suspense>
    {area === 'student' && <ShellMessaging />}
  </>
);

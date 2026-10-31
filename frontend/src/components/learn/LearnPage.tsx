'use client';

import { Suspense } from 'react';

import { LearnPlayer } from './LearnPlayer';
import { LearnSkeleton } from './LearnSkeleton';

import type { LearnArea } from './learn-tabs';
import type { FC } from 'react';

interface LearnPageProps {
  courseId: string;
  area: LearnArea;
}

/** The course player route (student, teacher and admin areas). Suspense: the open tab is kept in the URL. */
export const LearnPage: FC<LearnPageProps> = ({ courseId, area }) => (
  <Suspense fallback={<LearnSkeleton />}>
    <LearnPlayer courseId={courseId} area={area} />
  </Suspense>
);

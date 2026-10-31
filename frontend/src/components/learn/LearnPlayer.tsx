'use client';

import Box from '@mui/material/Box';
import { useState } from 'react';

import { isCourseId } from '@/api/browse.api';
import { isForbiddenError, isNotFoundError, useContentList, useLearnCourse } from '@/api/learn.api';

import { AREA_COURSES_PATH, visibleTabs, type LearnArea } from './learn-tabs';
import { findActiveLecture } from './learn.utils';
import { LearnLoadError } from './LearnLoadError';
import { LearnNav } from './LearnNav';
import { LearnSkeleton } from './LearnSkeleton';
import { LearnStatus } from './LearnStatus';
import { LearnTabContent } from './LearnTabContent';
import { LearnTopBar } from './LearnTopBar';
import { useLearnPermissions } from './useLearnPermissions';
import { useLearnTab } from './useLearnTab';

import type { FC } from 'react';

interface LearnPlayerProps {
  courseId: string;
  area: LearnArea;
}

const NAV_WIDTH = 220;
const NAV_SX = {
  width: { md: NAV_WIDTH },
  flexShrink: 0,
  bgcolor: 'background.paper',
  borderRight: { md: 1 },
  borderBottom: { xs: 1, md: 0 },
  borderColor: 'divider',
  position: { md: 'sticky' },
  top: { md: 0 },
  alignSelf: { md: 'flex-start' },
  minWidth: 0,
} as const;

/**
 * The course player. The course outline is public, so the announcements list doubles as the access check:
 * the server answers 403 to anyone who is not enrolled (or whose plan expired) and to other teachers.
 */
export const LearnPlayer: FC<LearnPlayerProps> = ({ courseId, area }) => {
  const permissions = useLearnPermissions();
  const { tab, setTab } = useLearnTab();
  const [lectureId, setLectureId] = useState<string | null>(null);
  const course = useLearnCourse(courseId);
  const access = useContentList('announcements', courseId);
  const backHref = AREA_COURSES_PATH[area];

  if (!isCourseId(courseId) || isNotFoundError(course.error) || isNotFoundError(access.error))
    return <LearnStatus kind="notFound" courseId={courseId} backHref={backHref} />;
  if (isForbiddenError(access.error))
    return <LearnStatus kind="noAccess" courseId={courseId} backHref={backHref} />;
  const failure = course.error ?? access.error;
  if (failure)
    return (
      <LearnLoadError
        message={failure.message}
        onRetry={() => void Promise.all([course.refetch(), access.refetch()])}
      />
    );
  if (!course.data || !access.data) return <LearnSkeleton />;

  const activeLecture = findActiveLecture(course.data, lectureId);
  const tabs = visibleTabs(permissions);
  const openTab = tabs.includes(tab) ? tab : 'lectures';

  return (
    <Box
      sx={{ minHeight: area === 'student' ? '100dvh' : undefined, bgcolor: 'background.default' }}
    >
      <LearnTopBar
        title={course.data.title}
        subtitle={openTab === 'lectures' ? activeLecture?.title : undefined}
        backHref={backHref}
      />
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        <Box component="nav" sx={NAV_SX}>
          <LearnNav tabs={tabs} value={openTab} onChange={setTab} />
        </Box>
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          <LearnTabContent
            tab={openTab}
            course={course.data}
            activeLecture={activeLecture}
            onSelectLecture={setLectureId}
          />
        </Box>
      </Box>
    </Box>
  );
};

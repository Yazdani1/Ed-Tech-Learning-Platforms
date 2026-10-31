'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { formatBdt } from '@/utils/price';

import { CourseStatBox } from './CourseStatBox';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { FC } from 'react';

interface CourseCardStatsProps {
  course: AdminCourse;
}

/** This month's earnings and enrolments of a course (both open its enrolments page). */
export const CourseCardStats: FC<CourseCardStatsProps> = ({ course }) => {
  const { t } = useTranslation();
  const stats = course.enrollmentStats;
  const href = `/admin/enrollments/${course._id}`;
  const linkLabel = t('adminCourses.list.statsLink', { title: course.title });
  return (
    <Box
      sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}
    >
      <CourseStatBox
        value={formatBdt(stats?.thisMonthEarned ?? 0)}
        label={t('adminCourses.list.earnedThisMonth')}
        href={href}
        linkLabel={linkLabel}
      />
      <CourseStatBox
        value={String(stats?.thisMonthCount ?? 0)}
        label={t('adminCourses.list.enrollmentsThisMonth')}
        href={href}
        linkLabel={linkLabel}
      />
    </Box>
  );
};

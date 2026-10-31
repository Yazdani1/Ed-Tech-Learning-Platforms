'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { useEnrollmentStats } from '@/api/admin-courses.api';
import { formatBdt } from '@/utils/price';

import { StatPill } from './StatPill';

import type { FC } from 'react';

interface EnrollmentStatsStripProps {
  courseId: string;
}

const STAT_COUNT = 6;
const STAT_SKELETON_HEIGHT = 64;
const GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
  gap: 1,
  mb: 3,
  p: 0,
} as const;

/** Totals per enrolment type, this month and lifetime earnings (Super Admin, Admin). */
export const EnrollmentStatsStrip: FC<EnrollmentStatsStripProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const stats = useEnrollmentStats(courseId, true);

  if (stats.isLoading) {
    return (
      <Box sx={GRID_SX} aria-busy="true" aria-label={t('common.loading')}>
        {Array.from({ length: STAT_COUNT }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={STAT_SKELETON_HEIGHT} />
        ))}
      </Box>
    );
  }
  // An error here is shown by the panels below (same endpoints family); the strip just stays out
  if (!stats.data) return null;
  const data = stats.data;

  return (
    <Box component="ul" aria-label={t('adminCourses.enrollments.stats.label')} sx={GRID_SX}>
      <StatPill label={t('adminCourses.enrollments.stats.total')} value={data.total} />
      <StatPill label={t('adminCourses.enrollments.stats.free')} value={data.free} />
      <StatPill label={t('adminCourses.enrollments.stats.paid')} value={data.paid} />
      <StatPill
        label={t('adminCourses.enrollments.stats.subscription')}
        value={data.subscription}
      />
      <StatPill label={t('adminCourses.enrollments.stats.thisMonth')} value={data.thisMonthCount} />
      <StatPill
        label={t('adminCourses.enrollments.stats.lifetimeEarned')}
        value={formatBdt(data.lifetimeEarned)}
      />
    </Box>
  );
};

'use client';

import People from '@mui/icons-material/People';
import School from '@mui/icons-material/School';
import SubscriptionsOutlined from '@mui/icons-material/SubscriptionsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { InsightStatCard } from '../InsightStatCard';
import { FOUR_COLUMNS } from '../period-icons';

import type { DashboardTotals } from '@/schemas/insights.schema';
import type { FC } from 'react';

interface DashboardStatGridProps {
  totals: DashboardTotals;
}

/** Students, enrolments, active subscriptions and courses (under the revenue cards). */
export const DashboardStatGrid: FC<DashboardStatGridProps> = ({ totals }) => {
  const { t } = useTranslation();
  const d = (key: string, options?: Record<string, unknown>): string =>
    t(`insights.dashboard.${key}`, options);
  return (
    <Box
      component="section"
      aria-label={t('insights.dashboard.countsLabel')}
      sx={{ display: 'grid', gap: 2, gridTemplateColumns: FOUR_COLUMNS, mb: 3 }}
    >
      <InsightStatCard
        icon={<People />}
        label={d('students')}
        value={totals.students}
        helper={d('newStudents', { count: totals.newStudentsThisMonth })}
      />
      <InsightStatCard
        icon={<TrendingUpOutlined />}
        label={d('enrollments')}
        value={totals.enrollments}
        helper={d('thisMonthEnrollments', { count: totals.thisMonthEnrollments })}
      />
      <InsightStatCard
        icon={<SubscriptionsOutlined />}
        label={d('activeSubscriptions')}
        value={totals.activeSubscriptions}
        helper={d('teachersCount', { count: totals.teachers })}
      />
      <InsightStatCard
        icon={<School />}
        label={d('courses')}
        value={totals.courses}
        helper={d('courseSplit', {
          published: totals.publishedCourses,
          draft: totals.draftCourses,
        })}
      />
    </Box>
  );
};

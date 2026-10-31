'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '../insights.utils';

import { PerformanceStatBlock } from './PerformanceStatBlock';

import type { PerformanceOverview } from '@/schemas/insights.schema';
import type { FC } from 'react';

const STATS_SKELETON_HEIGHT = 88;

interface PerformanceStatsProps {
  data: PerformanceOverview | undefined;
}

/** Revenue, enrolments and total students for the selected course(s). */
export const PerformanceStats: FC<PerformanceStatsProps> = ({ data }) => {
  const { t } = useTranslation();
  const { breakdown } = data ?? { breakdown: { free: 0, paid: 0, subscription: 0 } };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      {data ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 2, md: 5 },
          }}
        >
          <PerformanceStatBlock
            period={t('insights.performance.thisMonth')}
            value={formatMoney(data.thisMonthRevenue)}
            detail={t('insights.performance.totalRevenue', {
              amount: formatMoney(data.totalRevenue),
            })}
            label={t('insights.performance.revenue')}
          />
          <PerformanceStatBlock
            period={t('insights.performance.thisMonth')}
            value={String(data.thisMonthCount)}
            detail={t('insights.performance.totalEnrollments', { count: data.totalEnrollments })}
            label={t('insights.performance.enrollments')}
          />
          <PerformanceStatBlock
            period={t('insights.performance.allTime')}
            value={String(breakdown.free + breakdown.paid + breakdown.subscription)}
            detail={t('insights.performance.breakdownLine', breakdown)}
            label={t('insights.performance.totalStudents')}
          />
        </Box>
      ) : (
        <Skeleton
          variant="rounded"
          height={STATS_SKELETON_HEIGHT}
          aria-label={t('common.loading')}
        />
      )}
    </Paper>
  );
};

'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { useDashboardSummary } from '@/api/insights.api';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryState } from '@/components/common/QueryState';
import { useAuth } from '@/hooks/useAuth';

import { CHART_HEIGHT } from '../insights.utils';

import { DashboardRevenueCards } from './DashboardRevenueCards';
import { DashboardStatGrid } from './DashboardStatGrid';
import { TopCoursesCard } from './TopCoursesCard';

/** Room for the two chart rows while recharts loads. */
const CHARTS_PLACEHOLDER_HEIGHT = CHART_HEIGHT * 2;

// recharts is heavy and measures the browser window: loaded in the browser only, after the numbers
const DashboardCharts = dynamic(() => import('./DashboardCharts'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={CHARTS_PLACEHOLDER_HEIGHT} sx={{ mb: 3 }} />,
});

/** /admin/dashboard (Super Admin): revenue per period, headline counts, revenue charts and the top courses. */
export const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const summary = useDashboardSummary();

  return (
    <Box sx={{ pb: 3 }}>
      <PageHeader
        title={t('insights.dashboard.title')}
        subtitle={t('insights.dashboard.welcome', { name: user?.name ?? '' })}
      />
      <QueryState
        isLoading={summary.isPending}
        error={summary.error}
        onRetry={() => void summary.refetch()}
        skeletonRows={6}
      >
        {summary.data && (
          <>
            <DashboardRevenueCards revenue={summary.data.revenue} />
            <DashboardStatGrid totals={summary.data.totals} />
            <DashboardCharts summary={summary.data} />
            <TopCoursesCard courses={summary.data.topCourses} />
          </>
        )}
      </QueryState>
    </Box>
  );
};

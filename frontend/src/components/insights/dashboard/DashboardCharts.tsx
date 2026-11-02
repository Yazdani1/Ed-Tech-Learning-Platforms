'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { BreakdownPieChart } from '../BreakdownPieChart';
import { ChartCard } from '../ChartCard';
import {
  COURSE_REVENUE_COLOR,
  ENROLLMENT_COLOR,
  SUBSCRIPTION_REVENUE_COLOR,
  formatMoney,
} from '../insights.utils';

import { StackedRevenueChart } from './StackedRevenueChart';
import { TimelineChart } from './TimelineChart';

import type { DashboardSummary } from '@/schemas/insights.schema';
import type { FC } from 'react';

const TWO_COLUMNS = { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } as const;
/** Monthly revenue twice as wide as the source donut on desktop */
const WIDE_AND_NARROW = { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' } as const;
const SOURCE_COLORS = [COURSE_REVENUE_COLOR, SUBSCRIPTION_REVENUE_COLOR] as const;
const DONUT_HOLE = '55%';

interface DashboardChartsProps {
  summary: DashboardSummary;
}

/**
 * The dashboard charts (recharts, loaded on demand with next/dynamic): daily revenue and daily enrolments
 * side by side (same 30 days, each with its own axis), monthly revenue, and revenue by source.
 */
const DashboardCharts: FC<DashboardChartsProps> = ({ summary }) => {
  const { t } = useTranslation();
  const sources = [
    { label: t('insights.dashboard.courseRevenue'), value: summary.revenue.lifetime.course },
    {
      label: t('insights.dashboard.subscriptionRevenue'),
      value: summary.revenue.lifetime.subscription,
    },
  ];
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: TWO_COLUMNS, gap: 2, mb: 2 }}>
        <ChartCard title={t('insights.dashboard.revenueChart')}>
          <StackedRevenueChart data={summary.revenueTimeline} granularity="day" />
        </ChartCard>
        <ChartCard title={t('insights.dashboard.enrollmentChart')}>
          <TimelineChart
            data={summary.revenueTimeline}
            dataKey="enrollments"
            name={t('insights.dashboard.enrollments')}
            color={ENROLLMENT_COLOR}
          />
        </ChartCard>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: WIDE_AND_NARROW, gap: 2, mb: 3 }}>
        <ChartCard title={t('insights.dashboard.monthlyChart')}>
          <StackedRevenueChart data={summary.monthlyRevenue} granularity="month" />
        </ChartCard>
        <ChartCard title={t('insights.dashboard.sourceChart')}>
          <BreakdownPieChart
            data={sources}
            colors={SOURCE_COLORS}
            innerRadius={DONUT_HOLE}
            formatValue={formatMoney}
          />
        </ChartCard>
      </Box>
    </>
  );
};

export default DashboardCharts;

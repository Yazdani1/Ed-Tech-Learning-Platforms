'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { BreakdownPieChart } from '../BreakdownPieChart';
import { ChartCard } from '../ChartCard';
import { formatMoney, seriesColor } from '../insights.utils';

import { CountBarChart } from './CountBarChart';
import { TimelineChart } from './TimelineChart';

import type { DashboardSummary, LabelCount } from '@/schemas/insights.schema';
import type { TFunction } from 'i18next';
import type { FC } from 'react';

/** Labels from the server (role, status, pricing) in the viewer's language; unknown ones as they are. */
const translateCounts = (t: TFunction, prefix: string, counts: LabelCount[]): LabelCount[] =>
  counts.map((entry) => ({
    ...entry,
    label: t(`${prefix}.${entry.label}`, { defaultValue: entry.label }),
  }));

const TWO_COLUMNS = { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } as const;

interface DashboardChartsProps {
  summary: DashboardSummary;
}

/** Every dashboard chart (recharts, loaded on demand by the dashboard with next/dynamic). */
const DashboardCharts: FC<DashboardChartsProps> = ({ summary }) => {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: TWO_COLUMNS, gap: 2, mb: 3 }}>
        <ChartCard title={t('insights.dashboard.revenueChart')}>
          <TimelineChart
            data={summary.revenueTimeline}
            dataKey="totalRevenue"
            name={t('insights.dashboard.revenue')}
            color={seriesColor(0)}
            formatValue={formatMoney}
          />
        </ChartCard>
        <ChartCard title={t('insights.dashboard.enrollmentChart')}>
          <TimelineChart
            data={summary.revenueTimeline}
            dataKey="enrollments"
            name={t('insights.dashboard.enrollments')}
            color={seriesColor(2)}
          />
        </ChartCard>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 2,
          mb: 3,
        }}
      >
        <ChartCard title={t('insights.dashboard.rolesChart')}>
          <BreakdownPieChart data={translateCounts(t, 'insights.role', summary.roleCounts)} />
        </ChartCard>
        <ChartCard title={t('insights.dashboard.statusChart')}>
          <CountBarChart
            data={translateCounts(t, 'insights.courseStatus', summary.courseStatusCounts)}
            name={t('insights.dashboard.coursesSeries')}
            color={seriesColor(0)}
          />
        </ChartCard>
        <ChartCard title={t('insights.dashboard.pricingChart')}>
          <CountBarChart
            data={translateCounts(t, 'insights.pricing', summary.coursePricingCounts)}
            name={t('insights.dashboard.coursesSeries')}
            color={seriesColor(0)}
          />
        </ChartCard>
      </Box>
    </>
  );
};

export default DashboardCharts;

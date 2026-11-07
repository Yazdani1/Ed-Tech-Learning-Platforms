'use client';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { useRevenueBreakdown, useRevenueSummary } from '@/api/revenue.api';
import { ChartCard } from '@/components/insights/ChartCard';
import { CHART_HEIGHT, formatMoney, seriesColor } from '@/components/insights/insights.utils';
import { RevenueOverview } from '@/components/revenue/RevenueOverview';

import type { LabelCount } from '@/schemas/insights.schema';
import type { RevenueBreakdown } from '@/schemas/revenue.schema';
import type { FC, ReactNode } from 'react';

const loading = () => <Skeleton variant="rounded" height={CHART_HEIGHT} />;
const charts = () => import('./SalesInsightCharts');
const SalesVatChart = dynamic(() => charts().then((mod) => mod.SalesVatChart), {
  ssr: false,
  loading,
});
const EnrolmentTrendChart = dynamic(() => charts().then((mod) => mod.EnrolmentTrendChart), {
  ssr: false,
  loading,
});
const AverageOrderChart = dynamic(() => charts().then((mod) => mod.AverageOrderChart), {
  ssr: false,
  loading,
});
const TopCoursesBarChart = dynamic(() => charts().then((mod) => mod.TopCoursesBarChart), {
  ssr: false,
  loading,
});
const BreakdownPieChart = dynamic(
  () => import('@/components/insights/BreakdownPieChart').then((mod) => mod.BreakdownPieChart),
  { ssr: false, loading },
);

interface PerformanceSalesInsightsProps {
  /** The courses chosen in the page header (empty = every course) */
  courseIds: readonly string[];
}

const GRID_SX = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
} as const;
const DONUT = '55%';

/** Pie slices: enrolments by type, and where the list price went (net, VAT, discounts); empty slices left out. */
const breakdownSlices = (totals: RevenueBreakdown | undefined, c: (key: string) => string) => {
  if (!totals) return { types: [], money: [] };
  const nonEmpty = (slices: LabelCount[]) => slices.filter((slice) => slice.value > 0);
  return {
    types: nonEmpty([
      { label: c('paid'), value: totals.paidOrders },
      { label: c('free'), value: totals.freeOrders },
      { label: c('subscription'), value: totals.subscriptionOrders },
    ]),
    money: nonEmpty([
      { label: c('net'), value: totals.netRevenue },
      { label: c('vat'), value: totals.vat },
      { label: c('discount'), value: totals.discountTotal },
    ]),
  };
};

const emptyText = (text: string): ReactNode => (
  <Typography color="text.secondary" sx={{ pt: 4, textAlign: 'center' }}>
    {text}
  </Typography>
);

/**
 * Course sales of the chosen courses: the period cards and Daily / Weekly / Monthly chart (moved from the
 * Revenue page), then sales and VAT, enrolments, average order, enrolment types, top courses and where the
 * list price went (net, VAT, discounts).
 */
export const PerformanceSalesInsights: FC<PerformanceSalesInsightsProps> = ({ courseIds }) => {
  const { t } = useTranslation();
  const c = (key: string): string => t(`insights.performance.charts.${key}`);
  const filters = { type: 'all' as const, courseIds };
  const summary = useRevenueSummary(filters);
  const breakdown = useRevenueBreakdown(filters);
  const monthly = summary.data?.monthly ?? [];
  const totals = breakdown.data;
  const { types, money } = breakdownSlices(totals, c);

  return (
    <Box component="section" aria-label={c('section')} sx={{ mt: 4 }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.125rem', mb: 2 }}>
        {c('section')}
      </Typography>
      <RevenueOverview
        summary={summary.data}
        isPending={summary.isPending}
        error={summary.error}
        onRetry={() => void summary.refetch()}
      />
      <Box sx={GRID_SX}>
        <ChartCard title={c('salesVat')}>
          {monthly.length > 0 ? <SalesVatChart data={monthly} /> : loading()}
        </ChartCard>
        <ChartCard title={c('enrolments')}>
          {monthly.length > 0 ? <EnrolmentTrendChart data={monthly} /> : loading()}
        </ChartCard>
        <ChartCard title={c('averageOrder')}>
          {monthly.length > 0 ? <AverageOrderChart data={monthly} /> : loading()}
        </ChartCard>
        <ChartCard title={c('topCourses')}>
          {breakdown.isPending && loading()}
          {totals?.topCourses.length === 0 && emptyText(t('revenue.noPaidSales'))}
          {totals && totals.topCourses.length > 0 && (
            <TopCoursesBarChart data={totals.topCourses} />
          )}
        </ChartCard>
        <ChartCard title={c('types')}>
          {breakdown.isPending && loading()}
          {totals && types.length === 0 && emptyText(c('noEnrolments'))}
          {types.length > 0 && <BreakdownPieChart data={types} innerRadius={DONUT} />}
        </ChartCard>
        <ChartCard title={c('listPrice')}>
          {breakdown.isPending && loading()}
          {totals && money.length === 0 && emptyText(t('revenue.noPaidSales'))}
          {money.length > 0 && (
            <BreakdownPieChart
              data={money}
              colors={[seriesColor(0), seriesColor(3), seriesColor(5)]}
              innerRadius={DONUT}
              formatValue={formatMoney}
            />
          )}
        </ChartCard>
      </Box>
    </Box>
  );
};

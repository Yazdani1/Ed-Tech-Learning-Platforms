'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { BreakdownPieChart } from '../BreakdownPieChart';
import { CHART_HEIGHT } from '../insights.utils';

import { MetricTimeChart } from './MetricTimeChart';

import type { ChartMetric, ChartType } from './usePerformanceParams';
import type { PerformanceOverview } from '@/schemas/insights.schema';
import type { FC } from 'react';

interface PerformanceChartProps {
  data: PerformanceOverview;
  metric: ChartMetric;
  chart: ChartType;
}

/**
 * The report chart: the metric over time (line or bar), or the all-time enrolment breakdown (pie).
 * Default export: loaded with next/dynamic (recharts only in the browser).
 */
const PerformanceChart: FC<PerformanceChartProps> = ({ data, metric, chart }) => {
  const { t } = useTranslation();
  if (chart !== 'pie') {
    return <MetricTimeChart data={data.chartData} metric={metric} variant={chart} />;
  }
  const slices = [
    { label: t('insights.enrollmentType.free'), value: data.breakdown.free },
    { label: t('insights.enrollmentType.paid'), value: data.breakdown.paid },
    { label: t('insights.enrollmentType.subscription'), value: data.breakdown.subscription },
  ];
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, textAlign: 'center' }}>
        {t('insights.performance.breakdownTitle')}
      </Typography>
      <Box sx={{ height: CHART_HEIGHT }}>
        <BreakdownPieChart data={slices} />
      </Box>
    </Box>
  );
};

export default PerformanceChart;

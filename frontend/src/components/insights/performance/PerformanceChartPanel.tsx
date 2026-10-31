'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { CHART_HEIGHT } from '../insights.utils';

import { METRIC_LABEL_KEYS, RANGE_LABEL_KEYS } from './PerformanceControls';

import type { PerformanceParams } from './usePerformanceParams';
import type { PerformanceOverview } from '@/schemas/insights.schema';
import type { FC } from 'react';

// recharts is heavy and measures the browser window: loaded in the browser only
const PerformanceChart = dynamic(() => import('./PerformanceChart'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={CHART_HEIGHT} />,
});

interface PerformanceChartPanelProps {
  data: PerformanceOverview | undefined;
  params: PerformanceParams;
  /** True while another course or range loads (the previous chart stays) */
  isFetching: boolean;
}

/** The chart area: skeleton while loading, an empty message, or the chart. */
export const PerformanceChartPanel: FC<PerformanceChartPanelProps> = ({
  data,
  params,
  isFetching,
}) => {
  const { t } = useTranslation();
  const isEmpty = data?.chartData.length === 0 && params.chart !== 'pie';

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label={t('insights.performance.chartLabel', {
        metric: t(METRIC_LABEL_KEYS[params.metric]),
        range: t(RANGE_LABEL_KEYS[params.range]),
      })}
      aria-busy={isFetching}
      sx={{ p: { xs: 2, sm: 3 }, minHeight: CHART_HEIGHT }}
    >
      {!data && <Skeleton variant="rounded" height={CHART_HEIGHT} />}
      {isEmpty && (
        <Box sx={{ display: 'grid', placeItems: 'center', height: CHART_HEIGHT }}>
          <Typography color="text.secondary">{t('insights.performance.noData')}</Typography>
        </Box>
      )}
      {data && !isEmpty && (
        <PerformanceChart data={data} metric={params.metric} chart={params.chart} />
      )}
    </Paper>
  );
};

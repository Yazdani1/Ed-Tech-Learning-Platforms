'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { CHART_HEIGHT, formatMoney } from '../insights.utils';

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
  /** False while a custom range still needs its start and end day */
  isReady: boolean;
}

/**
 * The chart area: the totals of the chosen range, then a skeleton while loading, an empty message, a
 * "choose the days" hint for an unfinished custom range, or the chart.
 */
export const PerformanceChartPanel: FC<PerformanceChartPanelProps> = ({
  data,
  params,
  isFetching,
  isReady,
}) => {
  const { t } = useTranslation();
  const isEmpty = data?.chartData.length === 0 && params.chart !== 'pie';

  if (!isReady) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 3, display: 'grid', placeItems: 'center', minHeight: CHART_HEIGHT }}
      >
        <Typography color="text.secondary">{t('insights.performance.chooseDays')}</Typography>
      </Paper>
    );
  }

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
      {data && (
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }} aria-live="polite">
          {t('insights.performance.selectedLine', {
            range: t(RANGE_LABEL_KEYS[params.range]),
            revenue: formatMoney(data.selected.revenue),
            count: data.selected.enrollments,
            paid: data.selected.paidEnrollments,
          })}
        </Typography>
      )}
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

'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/common/FilterSelect';
import { DATE_RANGES, type DateRange } from '@/schemas/insights.schema';

import { ChartTypeToggle } from './ChartTypeToggle';
import { CHART_METRICS, type ChartMetric, type PerformanceParams } from './usePerformanceParams';

import type { FC } from 'react';

const SELECT_MIN_WIDTH = 160;
const SELECT_SX = { minWidth: SELECT_MIN_WIDTH, flex: { xs: 1, sm: 'none' } } as const;

export const RANGE_LABEL_KEYS: Record<DateRange, string> = {
  '7d': 'insights.performance.range7d',
  '30d': 'insights.performance.range30d',
  lifetime: 'insights.performance.rangeLifetime',
};

export const METRIC_LABEL_KEYS: Record<ChartMetric, string> = {
  revenue: 'insights.performance.metricRevenue',
  enrollments: 'insights.performance.metricEnrollments',
};

interface PerformanceControlsProps {
  metric: PerformanceParams['metric'];
  range: PerformanceParams['range'];
  chart: PerformanceParams['chart'];
  onChange: (changes: Partial<Pick<PerformanceParams, 'metric' | 'range' | 'chart'>>) => void;
}

/** Metric and date range pickers on the left, line / bar / pie switch on the right (wraps on phones). */
export const PerformanceControls: FC<PerformanceControlsProps> = ({
  metric,
  range,
  chart,
  onChange,
}) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          flex: { xs: '1 1 100%', sm: '0 1 auto' },
        }}
      >
        <Box sx={SELECT_SX}>
          <FilterSelect
            label={t('insights.performance.metric')}
            value={metric}
            options={CHART_METRICS.map((value) => ({ value, label: t(METRIC_LABEL_KEYS[value]) }))}
            onChange={(value) => {
              const next = CHART_METRICS.find((option) => option === value);
              if (next) onChange({ metric: next });
            }}
          />
        </Box>
        <Box sx={SELECT_SX}>
          <FilterSelect
            label={t('insights.performance.range')}
            value={range}
            options={DATE_RANGES.map((value) => ({ value, label: t(RANGE_LABEL_KEYS[value]) }))}
            onChange={(value) => {
              const next = DATE_RANGES.find((option) => option === value);
              if (next) onChange({ range: next });
            }}
          />
        </Box>
      </Box>
      <ChartTypeToggle
        value={chart}
        onChange={(value) => {
          onChange({ chart: value });
        }}
      />
    </Box>
  );
};

'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { FilterSelect } from '@/components/common/FilterSelect';
import { DATE_RANGES, type DateRange } from '@/schemas/insights.schema';

import { ChartTypeToggle } from './ChartTypeToggle';
import { CustomRangeInputs } from './CustomRangeInputs';
import { CHART_METRICS, type ChartMetric, type PerformanceParams } from './usePerformanceParams';

import type { FC } from 'react';

const SELECT_MIN_WIDTH = 170;
const SELECT_SX = { minWidth: SELECT_MIN_WIDTH, flex: { xs: 1, sm: 'none' } } as const;

export const RANGE_LABEL_KEYS: Record<DateRange, string> = {
  today: 'insights.performance.rangeToday',
  '7d': 'insights.performance.range7d',
  '30d': 'insights.performance.range30d',
  month: 'insights.performance.rangeMonth',
  lifetime: 'insights.performance.rangeLifetime',
  custom: 'insights.performance.rangeCustom',
};

export const METRIC_LABEL_KEYS: Record<ChartMetric, string> = {
  revenue: 'insights.performance.metricRevenue',
  enrollments: 'insights.performance.metricEnrollments',
  paidEnrollments: 'insights.performance.metricPaid',
};

type ControlChanges = Partial<
  Pick<PerformanceParams, 'metric' | 'range' | 'chart' | 'from' | 'to'>
>;

interface PerformanceControlsProps {
  params: PerformanceParams;
  onChange: (changes: ControlChanges) => void;
}

/** Date range (with start / end days for a custom range) and metric on the left, chart type on the right. */
export const PerformanceControls: FC<PerformanceControlsProps> = ({ params, onChange }) => {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flex: '1 1 auto', minWidth: 0 }}>
        <Box sx={SELECT_SX}>
          <FilterSelect
            label={t('insights.performance.range')}
            value={params.range}
            options={DATE_RANGES.map((value) => ({ value, label: t(RANGE_LABEL_KEYS[value]) }))}
            onChange={(value) => {
              const next = DATE_RANGES.find((option) => option === value);
              if (next) onChange({ range: next });
            }}
          />
        </Box>
        {params.range === 'custom' && (
          <CustomRangeInputs from={params.from} to={params.to} onChange={onChange} />
        )}
        <Box sx={SELECT_SX}>
          <FilterSelect
            label={t('insights.performance.metric')}
            value={params.metric}
            options={CHART_METRICS.map((value) => ({ value, label: t(METRIC_LABEL_KEYS[value]) }))}
            onChange={(value) => {
              const next = CHART_METRICS.find((option) => option === value);
              if (next) onChange({ metric: next });
            }}
          />
        </Box>
      </Box>
      <ChartTypeToggle
        value={params.chart}
        onChange={(value) => {
          onChange({ chart: value });
        }}
      />
    </Box>
  );
};

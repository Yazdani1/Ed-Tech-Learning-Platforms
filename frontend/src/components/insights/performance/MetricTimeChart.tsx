'use client';

import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBucketLabel } from '@/utils/dateTime';

import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_HEIGHT,
  GRID_COLOR,
  formatMoney,
  seriesColor,
} from '../insights.utils';

import { METRIC_LABEL_KEYS } from './PerformanceControls';

import type { ChartMetric } from './usePerformanceParams';
import type { Granularity, PerformancePoint } from '@/schemas/insights.schema';
import type { FC } from 'react';

const MAX_BAR_SIZE = 40;
const ACTIVE_DOT_RADIUS = 5;
const MARGIN = { top: 4, right: 16, left: 0, bottom: 0 };

/** Each metric keeps its colour whichever range is shown */
const METRIC_COLORS: Record<ChartMetric, string> = {
  revenue: seriesColor(0),
  enrollments: seriesColor(2),
  paidEnrollments: seriesColor(6),
};

interface MetricTimeChartProps {
  data: PerformancePoint[];
  metric: ChartMetric;
  variant: 'line' | 'bar';
  granularity: Granularity;
}

/** Revenue, enrolments or paid enrolments per hour (today), day or month, as a line or bars. */
export const MetricTimeChart: FC<MetricTimeChartProps> = ({
  data,
  metric,
  variant,
  granularity,
}) => {
  const { t, i18n } = useTranslation();
  const isRevenue = metric === 'revenue';
  const format = (value: number): string => (isRevenue ? formatMoney(value) : String(value));
  const label = (key: string): string => formatBucketLabel(key, granularity, i18n.language);
  const name = t(METRIC_LABEL_KEYS[metric]);
  const color = METRIC_COLORS[metric];
  const Chart = variant === 'bar' ? BarChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <Chart data={data} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          interval="preserveStartEnd"
          axisLine={false}
          tickLine={false}
          tickFormatter={label}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={isRevenue}
          tickFormatter={(value: number) => format(value)}
        />
        <Tooltip
          labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)}
          formatter={(value) => format(Number(value))}
        />
        {variant === 'bar' ? (
          <Bar
            dataKey={metric}
            name={name}
            fill={color}
            radius={BAR_RADIUS}
            maxBarSize={MAX_BAR_SIZE}
          />
        ) : (
          <Line
            type="monotone"
            dataKey={metric}
            name={name}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: ACTIVE_DOT_RADIUS }}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  );
};

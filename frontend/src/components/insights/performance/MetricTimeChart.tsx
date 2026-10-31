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

import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_HEIGHT,
  GRID_COLOR,
  formatMoney,
  seriesColor,
} from '../insights.utils';

import type { ChartMetric } from './usePerformanceParams';
import type { PerformancePoint } from '@/schemas/insights.schema';
import type { FC } from 'react';

const MAX_BAR_SIZE = 40;
const ACTIVE_DOT_RADIUS = 5;
const MARGIN = { top: 4, right: 16, left: 0, bottom: 0 };

interface MetricTimeChartProps {
  data: PerformancePoint[];
  metric: ChartMetric;
  variant: 'line' | 'bar';
}

/** Revenue or enrolments per day (7d/30d) or per month (lifetime), as a line or bars. */
export const MetricTimeChart: FC<MetricTimeChartProps> = ({ data, metric, variant }) => {
  const { t } = useTranslation();
  const isRevenue = metric === 'revenue';
  const format = (value: number): string => (isRevenue ? formatMoney(value) : String(value));
  const name = t(isRevenue ? 'insights.performance.revenue' : 'insights.performance.enrollments');
  const color = seriesColor(isRevenue ? 0 : 2);
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
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={isRevenue}
          tickFormatter={(value: number) => format(value)}
        />
        <Tooltip formatter={(value) => format(Number(value))} />
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

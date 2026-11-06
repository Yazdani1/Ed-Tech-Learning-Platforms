'use client';

import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import {
  AXIS_TICK,
  BAR_RADIUS,
  CHART_HEIGHT,
  GRID_COLOR,
  formatMoney,
  seriesColor,
} from '@/components/insights/insights.utils';
import { formatBucketLabel } from '@/utils/dateTime';

import type { RevenuePoint } from '@/schemas/revenue.schema';
import type { FC } from 'react';

export type RevenueRange = 'daily' | 'weekly' | 'monthly';

interface RevenueChartProps {
  data: readonly RevenuePoint[];
  range: RevenueRange;
}

const MAX_BAR_SIZE = 36;
const MARGIN = { top: 4, right: 16, left: 0, bottom: 0 };
const COLORS: Record<RevenueRange, string> = {
  daily: seriesColor(0),
  weekly: seriesColor(2),
  monthly: seriesColor(6),
};

/** Course sales per day (30 days), per week (12 weeks, labelled by the Monday) or per month (12 months). */
const RevenueChart: FC<RevenueChartProps> = ({ data, range }) => {
  const { t, i18n } = useTranslation();
  const label = (key: string): string => {
    const text = formatBucketLabel(key, range === 'monthly' ? 'month' : 'day', i18n.language);
    return range === 'weekly' ? t('revenue.chart.weekOf', { date: text }) : text;
  };
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={[...data]} margin={MARGIN}>
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
          tickFormatter={(value: number) => formatMoney(value)}
        />
        <Tooltip
          labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)}
          formatter={(value, name) =>
            name === 'revenue' ? formatMoney(Number(value)) : String(value)
          }
        />
        <Bar
          dataKey="revenue"
          name={t('revenue.chart.revenue')}
          fill={COLORS[range]}
          radius={BAR_RADIUS}
          maxBarSize={MAX_BAR_SIZE}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;

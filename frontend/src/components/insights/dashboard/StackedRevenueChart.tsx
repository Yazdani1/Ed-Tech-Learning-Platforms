'use client';

import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBucketLabel } from '@/utils/dateTime';

import {
  AXIS_TICK,
  BAR_RADIUS,
  COURSE_REVENUE_COLOR,
  GRID_COLOR,
  SUBSCRIPTION_REVENUE_COLOR,
  formatMoney,
} from '../insights.utils';

import type { TimelineEntry } from '@/schemas/insights.schema';
import type { FC } from 'react';

const MAX_BAR_SIZE = 36;
/** Surface-coloured gap between the stacked segments */
const SEGMENT_GAP = 2;
const MARGIN = { top: 4, right: 12, left: 0, bottom: 0 };

interface StackedRevenueChartProps {
  data: TimelineEntry[];
  /** day: the last 30 days; month: the last 12 months */
  granularity: 'day' | 'month';
}

/** Revenue per day or month, course and subscription stacked (one money axis), with a legend. */
export const StackedRevenueChart: FC<StackedRevenueChartProps> = ({ data, granularity }) => {
  const { t, i18n } = useTranslation();
  const gap = useTheme().palette.background.paper;
  const label = (key: string): string => formatBucketLabel(key, granularity, i18n.language);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={MARGIN}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          tickLine={false}
          interval="preserveStartEnd"
          tickFormatter={label}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatMoney(value)}
        />
        <Tooltip
          cursor={{ fillOpacity: 0.3 }}
          labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)}
          formatter={(value) => formatMoney(Number(value))}
        />
        <Legend />
        <Bar
          dataKey="courseRevenue"
          stackId="revenue"
          name={t('insights.dashboard.courseRevenue')}
          fill={COURSE_REVENUE_COLOR}
          stroke={gap}
          strokeWidth={SEGMENT_GAP}
          maxBarSize={MAX_BAR_SIZE}
        />
        <Bar
          dataKey="subscriptionRevenue"
          stackId="revenue"
          name={t('insights.dashboard.subscriptionRevenue')}
          fill={SUBSCRIPTION_REVENUE_COLOR}
          stroke={gap}
          strokeWidth={SEGMENT_GAP}
          radius={BAR_RADIUS}
          maxBarSize={MAX_BAR_SIZE}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

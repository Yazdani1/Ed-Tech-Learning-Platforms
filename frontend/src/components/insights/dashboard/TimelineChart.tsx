'use client';

import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatBucketLabel } from '@/utils/dateTime';

import { AXIS_TICK, GRID_COLOR } from '../insights.utils';

import type { TimelineEntry } from '@/schemas/insights.schema';
import type { FC } from 'react';

const FILL_OPACITY = 0.18;

interface TimelineChartProps {
  data: TimelineEntry[];
  dataKey: 'enrollments' | 'paidEnrollments';
  /** Series name in the tooltip */
  name: string;
  color: string;
}

/** Enrolments per day over the last 30 days (its own count axis: never shares an axis with money). */
export const TimelineChart: FC<TimelineChartProps> = ({ data, dataKey, name, color }) => {
  const { i18n } = useTranslation();
  const label = (key: string): string => formatBucketLabel(key, 'day', i18n.language);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
        <XAxis
          dataKey="date"
          tick={AXIS_TICK}
          interval="preserveStartEnd"
          tickLine={false}
          tickFormatter={label}
        />
        <YAxis tick={AXIS_TICK} allowDecimals={false} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={(value) => (typeof value === 'string' ? label(value) : value)} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={FILL_OPACITY}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

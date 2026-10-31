'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AXIS_TICK, GRID_COLOR } from '../insights.utils';

import type { TimelineEntry } from '@/schemas/insights.schema';
import type { FC } from 'react';

const FILL_OPACITY = 0.18;

interface TimelineChartProps {
  data: TimelineEntry[];
  dataKey: 'totalRevenue' | 'enrollments';
  /** Series name in the tooltip */
  name: string;
  color: string;
  /** Formats the y axis and tooltip values (money) */
  formatValue?: (value: number) => string;
}

/** One series over the last 30 days (one y axis per chart: revenue and enrollments are separate charts). */
export const TimelineChart: FC<TimelineChartProps> = ({
  data,
  dataKey,
  name,
  color,
  formatValue = String,
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
      <XAxis dataKey="date" tick={AXIS_TICK} interval="preserveStartEnd" tickLine={false} />
      <YAxis
        tick={AXIS_TICK}
        allowDecimals={false}
        tickLine={false}
        axisLine={false}
        tickFormatter={(value: number) => formatValue(value)}
      />
      <Tooltip formatter={(value) => formatValue(Number(value))} />
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

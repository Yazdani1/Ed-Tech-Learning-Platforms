'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AXIS_TICK, BAR_RADIUS, GRID_COLOR } from '../insights.utils';

import type { LabelCount } from '@/schemas/insights.schema';
import type { FC } from 'react';

const MAX_BAR_SIZE = 64;

interface CountBarChartProps {
  data: LabelCount[];
  /** Series name in the tooltip */
  name: string;
  color: string;
}

/** Counts per label (course status, pricing) as vertical bars. */
export const CountBarChart: FC<CountBarChartProps> = ({ data, name, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
      <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} />
      <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
      <Tooltip cursor={{ fillOpacity: 0.4 }} />
      <Bar dataKey="value" name={name} fill={color} radius={BAR_RADIUS} maxBarSize={MAX_BAR_SIZE} />
    </BarChart>
  </ResponsiveContainer>
);

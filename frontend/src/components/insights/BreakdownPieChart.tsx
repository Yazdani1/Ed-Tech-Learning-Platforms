'use client';

import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { seriesColor } from './insights.utils';

import type { LabelCount } from '@/schemas/insights.schema';
import type { FC } from 'react';

const OUTER_RADIUS = '75%';
/** Surface-coloured gap between slices */
const SLICE_GAP = 2;

interface BreakdownPieChartProps {
  data: LabelCount[];
  /** Fixed colours per slice (same order as data); default: the categorical order */
  colors?: readonly string[];
  /** Turns the pie into a donut (e.g. '55%') */
  innerRadius?: string;
  /** Formats the tooltip values (money) */
  formatValue?: (value: number) => string;
}

/** Share of each label (enrolment types, revenue sources), with a legend and value labels. */
export const BreakdownPieChart: FC<BreakdownPieChartProps> = ({
  data,
  colors,
  innerRadius,
  formatValue = String,
}) => {
  // Each slice carries its own colour (fixed order, so a slice keeps its colour)
  const slices = data.map((entry, index) => ({
    ...entry,
    fill: colors?.[index] ?? seriesColor(index),
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="label"
          outerRadius={OUTER_RADIUS}
          innerRadius={innerRadius}
          stroke="#fff"
          strokeWidth={SLICE_GAP}
          label={({ value }) => formatValue(value)}
        />
        <Tooltip formatter={(value) => formatValue(Number(value))} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

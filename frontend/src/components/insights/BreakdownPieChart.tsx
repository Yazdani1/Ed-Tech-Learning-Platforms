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
}

/** Share of each label (users by role, enrolment types), with a legend and value labels. */
export const BreakdownPieChart: FC<BreakdownPieChartProps> = ({ data }) => {
  // Each slice carries its own colour (fixed categorical order)
  const slices = data.map((entry, index) => ({ ...entry, fill: seriesColor(index) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="label"
          outerRadius={OUTER_RADIUS}
          stroke="#fff"
          strokeWidth={SLICE_GAP}
          label
        />
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

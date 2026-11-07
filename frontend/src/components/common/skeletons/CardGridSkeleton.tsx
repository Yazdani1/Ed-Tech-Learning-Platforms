import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

import type { ResponsiveStyleValue } from '@mui/system';
import type { FC } from 'react';

interface CardGridSkeletonProps {
  count: number;
  /** Same grid columns as the real cards */
  columns: ResponsiveStyleValue<string>;
  height: number;
  mb?: number;
}

/** Grey boxes in the same grid as the cards they stand for (stat cards, charts, tiles). */
export const CardGridSkeleton: FC<CardGridSkeletonProps> = ({ count, columns, height, mb = 2 }) => (
  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: columns, mb }}>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} variant="rounded" height={height} />
    ))}
  </Box>
);

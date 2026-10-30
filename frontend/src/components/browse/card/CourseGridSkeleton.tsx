import Grid from '@mui/material/Grid';

import { CourseCardSkeleton } from './CourseCardSkeleton';

import type { GridSize } from './CourseGrid';
import type { FC } from 'react';

interface CourseGridSkeletonProps {
  count: number;
  size: GridSize;
}

/** Card placeholders in the same grid as the courses, while they load. */
export const CourseGridSkeleton: FC<CourseGridSkeletonProps> = ({ count, size }) => (
  <Grid container spacing={3} aria-busy="true">
    {Array.from({ length: count }, (_, index) => (
      <Grid key={index} size={size}>
        <CourseCardSkeleton />
      </Grid>
    ))}
  </Grid>
);

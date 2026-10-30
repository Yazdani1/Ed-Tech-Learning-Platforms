'use client';

import Grid from '@mui/material/Grid';

import { CourseCard } from './CourseCard';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

export interface GridSize {
  xs: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

interface CourseGridProps {
  courses: Course[];
  enrolledIds: readonly string[];
  size: GridSize;
}

/** Course cards in a responsive grid (one column on phones). */
export const CourseGrid: FC<CourseGridProps> = ({ courses, enrolledIds, size }) => (
  <Grid container spacing={3} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
    {courses.map((course) => (
      <Grid key={course._id} size={size} component="li">
        <CourseCard course={course} isEnrolled={enrolledIds.includes(course._id)} />
      </Grid>
    ))}
  </Grid>
);

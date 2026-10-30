'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useId } from 'react';

import { EnrolledCourseCard } from './EnrolledCourseCard';

import type { EnrolledCourse } from '@/schemas/catalog.schema';
import type { FC, ReactNode } from 'react';

/** Card grid: 1 column on phones, 2 on tablets, 3-4 on desktops. */
export const COURSE_GRID_SIZE = { xs: 12, sm: 6, md: 4, lg: 3 } as const;

interface EnrolledCourseSectionProps {
  title: string;
  icon?: ReactNode;
  countColor?: string;
  courses: EnrolledCourse[];
  emptyText: string;
  onRemove: (course: EnrolledCourse) => void;
  removingId?: string;
}

/** A labelled group of enrolled courses with its count. */
export const EnrolledCourseSection: FC<EnrolledCourseSectionProps> = ({
  title,
  icon,
  countColor,
  courses,
  emptyText,
  onRemove,
  removingId,
}) => {
  const headingId = useId();
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        {icon}
        <Typography id={headingId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Chip
          label={courses.length}
          size="small"
          color={countColor ? undefined : 'primary'}
          sx={countColor ? { bgcolor: countColor, color: 'common.white' } : undefined}
        />
      </Box>
      {courses.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid key={course._id} size={COURSE_GRID_SIZE}>
              <EnrolledCourseCard
                course={course}
                onRemove={onRemove}
                removing={removingId === course._id}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

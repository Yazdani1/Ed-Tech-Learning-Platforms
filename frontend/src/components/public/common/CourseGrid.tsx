'use client';

import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { useTranslation } from 'react-i18next';

import { useEnrolledCourseIds } from '@/api/catalog.api';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROLES } from '@/utils/roles';

import { CourseCard } from './CourseCard';

import type { CourseCardData } from '@/schemas/public.schema';
import type { FC } from 'react';

interface CourseGridProps {
  courses: CourseCardData[] | undefined;
  isLoading: boolean;
  /** Skeleton cards while loading */
  skeletons: number;
  /** Columns per breakpoint */
  size?: { xs: number; sm: number; md: number; lg?: number };
}

const DEFAULT_SIZE = { xs: 12, sm: 6, md: 4, lg: 3 };
const SKELETON_HEIGHT = 300;

/** Grid of course cards; a signed-in Student sees "Continue Learning" on courses they are enrolled in. */
export const CourseGrid: FC<CourseGridProps> = ({
  courses,
  isLoading,
  skeletons,
  size = DEFAULT_SIZE,
}) => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const { data: enrolledIds } = useEnrolledCourseIds(hasRole(STUDENT_ROLES));

  if (isLoading) {
    return (
      <Grid container spacing={3} aria-busy="true" aria-label={t('common.loading')}>
        {Array.from({ length: skeletons }, (_, index) => (
          <Grid key={index} size={size}>
            <Skeleton variant="rounded" height={SKELETON_HEIGHT} />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {(courses ?? []).map((course) => (
        <Grid key={course._id} size={size}>
          <CourseCard course={course} isEnrolled={enrolledIds?.includes(course._id) ?? false} />
        </Grid>
      ))}
    </Grid>
  );
};

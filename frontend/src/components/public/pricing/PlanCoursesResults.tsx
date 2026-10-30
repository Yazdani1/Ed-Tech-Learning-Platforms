'use client';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { CourseGrid } from '../common/CourseGrid';

import type { CourseCardData } from '@/schemas/public.schema';
import type { FC } from 'react';

interface PlanCoursesResultsProps {
  courses: CourseCardData[];
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  hasFilter: boolean;
  onClearFilters: () => void;
}

const SKELETONS = 6;
const GRID_SIZE = { xs: 12, sm: 6, md: 4 };

/** Count line and course grid of the included-courses dialog (with loading, error and empty states). */
export const PlanCoursesResults: FC<PlanCoursesResultsProps> = ({
  courses,
  isPending,
  error,
  onRetry,
  hasFilter,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {!isPending && !error && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('public.planCourses.count', { count: courses.length })}
        </Typography>
      )}
      <QueryState
        isLoading={false}
        error={error}
        onRetry={onRetry}
        isEmpty={!isPending && courses.length === 0}
        emptyText={t(hasFilter ? 'public.planCourses.noMatch' : 'public.planCourses.none')}
        emptyAction={
          hasFilter && (
            <Button onClick={onClearFilters} sx={{ minHeight: 44 }}>
              {t('public.planCourses.clear')}
            </Button>
          )
        }
      >
        <CourseGrid
          courses={courses}
          isLoading={isPending}
          skeletons={SKELETONS}
          size={GRID_SIZE}
        />
      </QueryState>
    </>
  );
};

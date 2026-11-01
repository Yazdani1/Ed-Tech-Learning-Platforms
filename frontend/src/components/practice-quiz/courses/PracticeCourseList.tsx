'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { PracticeCourseItem } from './PracticeCourseItem';
import { PracticeCourseListHeader } from './PracticeCourseListHeader';

import type { FC } from 'react';
import type {
  PracticeCourse,
  PracticeCourseFilters as Filters,
} from '@/schemas/practice-quiz.schema';
import type { ApiError } from '@/services/http.service';

interface PracticeCourseListProps {
  courses: PracticeCourse[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  filters: Filters;
  onFiltersChange: (changes: Partial<Filters>) => void;
  selectedCourseId: string | null;
  onSelect: (courseId: string) => void;
}

/** "Browse Free Quizzes": course count, filter panel and the courses that have free-preview quizzes. */
export const PracticeCourseList: FC<PracticeCourseListProps> = ({
  courses = [],
  isLoading,
  error,
  onRetry,
  filters,
  onFiltersChange,
  selectedCourseId,
  onSelect,
}) => {
  const { t } = useTranslation();
  return (
    <Box component="section" aria-label={t('quiz.practice.courses.list')}>
      <PracticeCourseListHeader
        count={isLoading ? null : courses.length}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
      <Box sx={{ py: 1.5, px: isLoading || error ? 1.5 : 0 }}>
        <QueryState
          isLoading={isLoading}
          error={error}
          onRetry={onRetry}
          isEmpty={courses.length === 0}
          emptyText={t('quiz.practice.courses.empty')}
          skeletonRows={3}
        >
          <List disablePadding>
            {courses.map((course) => (
              <PracticeCourseItem
                key={course._id}
                course={course}
                selected={course._id === selectedCourseId}
                onSelect={() => {
                  onSelect(course._id);
                }}
              />
            ))}
          </List>
        </QueryState>
      </Box>
    </Box>
  );
};

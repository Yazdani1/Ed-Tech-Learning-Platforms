'use client';

import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { AdminCourseCard } from './AdminCourseCard';
import { CourseCardMenu } from './CourseCardMenu';
import { useCourseActions } from './useCourseActions';

import type { AdminCourse } from '@/schemas/admin-courses.schema';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

interface AdminCourseListProps {
  courses: AdminCourse[] | undefined;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  canManage: boolean;
}

/** The course cards (two per row from 900 px) with loading, error and empty states. */
export const AdminCourseList: FC<AdminCourseListProps> = ({
  courses,
  isLoading,
  error,
  onRetry,
  canManage,
}) => {
  const { t } = useTranslation();
  const actions = useCourseActions();
  const rows = courses ?? [];

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      isEmpty={rows.length === 0}
      emptyText={t(canManage ? 'adminCourses.list.empty' : 'adminCourses.list.emptyPublished')}
    >
      <Grid container spacing={3} component="section" aria-label={t('adminCourses.list.label')}>
        {rows.map((course) => (
          <Grid key={course._id} size={{ xs: 12, md: 6 }}>
            <AdminCourseCard
              course={course}
              canManage={canManage}
              menu={
                <CourseCardMenu
                  course={course}
                  canManage={canManage}
                  busy={actions.busyId === course._id}
                  onToggleStatus={actions.toggleStatus}
                  onDelete={actions.remove}
                />
              }
            />
          </Grid>
        ))}
      </Grid>
    </QueryState>
  );
};

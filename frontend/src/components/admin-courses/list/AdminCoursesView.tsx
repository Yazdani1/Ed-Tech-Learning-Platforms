'use client';

import Box from '@mui/material/Box';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { useAdminCourses } from '@/api/admin-courses.api';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { useUrlListParams } from '@/hooks/useUrlListParams';
import { MANAGER_ROLES } from '@/utils/roles';

import { AdminCourseList } from './AdminCourseList';
import { courseFiltersSchema, EMPTY_FILTERS, toCourseQuery } from './course-filters';
import { CourseFilterPanel } from './CourseFilterPanel';
import { CourseListActions } from './CourseListActions';

// The bulk dialog is big and only opened on demand
const BulkEditModal = dynamic(
  () => import('../bulk/BulkEditModal').then((module) => module.BulkEditModal),
  { ssr: false },
);

/**
 * /admin/courses (Super Admin, Admin, Moderator): every course with filters. Super Admin and Admin also get
 * status, monthly figures, publish / unpublish, delete, bulk edit and create; Moderators see published courses.
 */
export const AdminCoursesView = () => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canManage = hasRole(MANAGER_ROLES);
  const { params, setParams } = useUrlListParams(courseFiltersSchema);
  const courses = useAdminCourses(toCourseQuery(params, !canManage));
  const bulk = useModal();
  const loaded = courses.data ?? [];

  return (
    <Box>
      <PageHeader
        title={t('adminCourses.title')}
        actions={
          canManage && (
            <CourseListActions
              onBulkEdit={() => {
                bulk.openModal();
              }}
              bulkDisabled={loaded.length === 0}
            />
          )
        }
      />
      <CourseFilterPanel
        filters={params}
        onChange={(key, value) => {
          setParams({ [key]: value });
        }}
        onClear={() => {
          setParams(EMPTY_FILTERS);
        }}
        count={courses.isLoading ? undefined : loaded.length}
        isModerator={!canManage}
      />
      <AdminCourseList
        courses={courses.data}
        isLoading={courses.isLoading}
        error={courses.error}
        onRetry={() => void courses.refetch()}
        canManage={canManage}
      />
      {canManage && bulk.open && (
        <BulkEditModal open={bulk.open} courses={loaded} onClose={bulk.closeModal} />
      )}
    </Box>
  );
};

'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteCourse } from '@/api/admin-courses.api';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import { toastError } from '@/utils/toast-error';

import type { AdminCourse } from '@/schemas/admin-courses.schema';

export interface CourseActions {
  remove: (course: AdminCourse) => void;
  /** The course a request is running for (its menu is disabled meanwhile) */
  busyId: string | undefined;
}

/**
 * Delete (asks first; the backend refuses a course that was ever published and its message is shown as is).
 * Super Admin and Admin only.
 */
export const useCourseActions = (): CourseActions => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deleteCourse = useDeleteCourse();

  const remove = async (course: AdminCourse): Promise<void> => {
    if (!(await confirmDelete(course.title))) return;
    await deleteCourse
      .mutateAsync(course._id)
      .then(() => {
        toast.success(t('adminCourses.list.deleted'));
      })
      .catch(toastError);
  };

  const busyId = deleteCourse.isPending ? deleteCourse.variables : undefined;

  return {
    remove: (course) => void remove(course),
    busyId,
  };
};

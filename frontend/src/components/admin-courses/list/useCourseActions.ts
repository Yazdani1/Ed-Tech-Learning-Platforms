'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteCourse, useSetCourseStatus } from '@/api/admin-courses.api';
import { useConfirm, useDeleteConfirm } from '@/hooks/useConfirm';

import { toastError } from '@/utils/toast-error';

import type { AdminCourse } from '@/schemas/admin-courses.schema';

export interface CourseActions {
  toggleStatus: (course: AdminCourse) => void;
  remove: (course: AdminCourse) => void;
  /** The course a request is running for (its menu is disabled meanwhile) */
  busyId: string | undefined;
}

/**
 * Publish / unpublish (unpublishing asks first) and delete (asks first; the backend refuses a course with
 * enrolments and its message is shown as is). Super Admin and Admin only.
 */
export const useCourseActions = (): CourseActions => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const confirmDelete = useDeleteConfirm();
  const setStatus = useSetCourseStatus();
  const deleteCourse = useDeleteCourse();

  const toggleStatus = async (course: AdminCourse): Promise<void> => {
    const publish = course.status !== 'Published';
    if (
      !publish &&
      !(await confirm({
        title: t('adminCourses.list.unpublishTitle'),
        message: t('adminCourses.list.unpublishMessage', { title: course.title }),
        confirmLabel: t('adminCourses.list.unpublish'),
      }))
    )
      return;
    await setStatus
      .mutateAsync({ id: course._id, status: publish ? 'Published' : 'Draft' })
      .then(() => {
        toast.success(
          t(publish ? 'adminCourses.list.published' : 'adminCourses.list.unpublished', {
            title: course.title,
          }),
        );
      })
      .catch(toastError);
  };

  const remove = async (course: AdminCourse): Promise<void> => {
    if (!(await confirmDelete(course.title))) return;
    await deleteCourse
      .mutateAsync(course._id)
      .then(() => {
        toast.success(t('adminCourses.list.deleted'));
      })
      .catch(toastError);
  };

  const busyId = setStatus.isPending
    ? setStatus.variables.id
    : deleteCourse.isPending
      ? deleteCourse.variables
      : undefined;

  return {
    toggleStatus: (course) => void toggleStatus(course),
    remove: (course) => void remove(course),
    busyId,
  };
};

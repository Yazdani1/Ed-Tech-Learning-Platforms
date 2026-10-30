'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUnenroll } from '@/api/catalog.api';
import { useConfirm } from '@/hooks/useConfirm';

import type { EnrolledCourse } from '@/schemas/catalog.schema';

export interface RemoveEnrollment {
  /** Asks for confirmation, then removes the enrolment (toast on success or failure) */
  onRemove: (course: EnrolledCourse) => void;
  /** The course being removed right now */
  removingId: string | undefined;
}

/** "Remove from my courses" with the confirmation dialog. */
export const useRemoveEnrollment = (): RemoveEnrollment => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const unenroll = useUnenroll();

  const remove = async (course: EnrolledCourse): Promise<void> => {
    const confirmed = await confirm({
      title: t('student.removeTitle'),
      message: t('student.removeMessage', { title: course.title }),
      confirmLabel: t('student.removeConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    unenroll.mutate(course._id, {
      onSuccess: () => toast.success(t('student.removed', { title: course.title })),
      onError: (error) => toast.error(error.message),
    });
  };

  return {
    onRemove: (course) => void remove(course),
    removingId: unenroll.isPending ? unenroll.variables : undefined,
  };
};

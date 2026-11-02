'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateCourseExtras } from '@/api/course-extras.api';

import type { CourseExtrasPatch } from '@/schemas/course-extras.schema';

export interface SaveExtras {
  /** Saves the sections; toasts success or the server's message; onDone runs after a success */
  save: (patch: CourseExtrasPatch, onDone?: () => void) => void;
  isSaving: boolean;
}

/** Saving a course page section from the editor, with the usual success / error toasts. */
export const useSaveExtras = (courseId: string): SaveExtras => {
  const { t } = useTranslation();
  const update = useUpdateCourseExtras(courseId);
  return {
    save: (patch, onDone) => {
      update.mutate(patch, {
        onSuccess: () => {
          toast.success(t('catalog.extras.saved'));
          onDone?.();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      });
    },
    isSaving: update.isPending,
  };
};

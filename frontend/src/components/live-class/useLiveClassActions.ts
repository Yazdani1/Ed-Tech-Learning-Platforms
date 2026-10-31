'use client';

import { useTranslation } from 'react-i18next';

import { useDeleteLiveClass, useSaveLiveClass } from '@/api/live-class.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import type { LiveClassWeek } from '@/schemas/browse.schema';
import type { LiveClassRequest } from '@/schemas/learn.schema';

export interface LiveClassActions {
  /** Adds a week, or replaces `week` (title, description, week name and the whole class list) */
  save: (week: LiveClassWeek | undefined, values: LiveClassRequest) => Promise<boolean>;
  remove: (week: LiveClassWeek) => void;
  isSaving: boolean;
}

/** Add, edit and delete live class weeks (study curricula) of a course, with toasts and a confirm. */
export const useLiveClassActions = (courseId: string): LiveClassActions => {
  const { t } = useTranslation();
  const run = useToastResult();
  const confirm = useConfirm();
  const save = useSaveLiveClass(courseId);
  const destroy = useDeleteLiveClass(courseId);

  return {
    save: (week, body) =>
      run(
        save.mutateAsync({ id: week?._id, body }),
        t(week ? 'catalog.liveClass.updated' : 'catalog.liveClass.added'),
      ),
    remove: (week) => {
      void confirm({
        title: t('catalog.liveClass.deleteTitle'),
        message: t('catalog.liveClass.deleteMessage'),
        confirmLabel: t('common.delete'),
        destructive: true,
      }).then((ok) => ok && run(destroy.mutateAsync(week._id), t('catalog.liveClass.deleted')));
    },
    isSaving: save.isPending,
  };
};

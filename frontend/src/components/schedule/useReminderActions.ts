'use client';

import { useTranslation } from 'react-i18next';

import { useDeleteSchedule, useUpdateSchedule } from '@/api/schedule.api';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import type { Schedule } from '@/schemas/schedule.schema';

export interface ReminderActions {
  completing: boolean;
  busy: boolean;
  complete: () => void;
  askDelete: () => void;
}

/** "Complete Session" and delete (after a confirmation) for one reminder. */
export const useReminderActions = (reminder: Schedule): ReminderActions => {
  const { t } = useTranslation();
  const update = useUpdateSchedule();
  const remove = useDeleteSchedule();
  const toastResult = useToastResult();
  const confirmDelete = useDeleteConfirm();

  const askDelete = async (): Promise<void> => {
    if (!(await confirmDelete(reminder.title))) return;
    await toastResult(remove.mutateAsync(reminder._id), t('schedule.reminder.deleted'));
  };

  return {
    completing: update.isPending,
    busy: update.isPending || remove.isPending,
    complete: () => {
      void toastResult(
        update.mutateAsync({
          id: reminder._id,
          body: { status: 'completed', completedAt: new Date().toISOString() },
        }),
        t('schedule.reminder.completed'),
      );
    },
    askDelete: () => {
      void askDelete();
    },
  };
};

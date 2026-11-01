'use client';

import { useTranslation } from 'react-i18next';

import { useDeleteNotification } from '@/api/notifications.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';

import type { Notification } from '@/schemas/notifications.schema';

/** Asks "Delete …? Recipients will no longer see it." and deletes the notification on yes. */
export const useDeleteSentNotification = (): ((notification: Notification) => Promise<void>) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toastResult = useToastResult();
  const remove = useDeleteNotification();
  return async (notification) => {
    const confirmed = await confirm({
      title: t('messaging.notifications.deleteTitle'),
      message: t('messaging.notifications.deleteMessage', { title: notification.title }),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (confirmed) {
      await toastResult(remove.mutateAsync(notification._id), t('messaging.notifications.deleted'));
    }
  };
};

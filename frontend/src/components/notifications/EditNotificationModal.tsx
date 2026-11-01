'use client';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useUpdateNotification } from '@/api/notifications.api';
import { AppModal } from '@/components/common/AppModal';

import { toNotificationForm, useNotificationForm } from './notification-form';
import { NotificationFormFields } from './NotificationFormFields';

import type { Notification } from '@/schemas/notifications.schema';
import type { FC } from 'react';

interface EditNotificationModalProps {
  open: boolean;
  notification: Notification | undefined;
  onClose: () => void;
}

/** Edit a sent notification: title, message, priority and roles (recipients follow the new roles). */
export const EditNotificationModal: FC<EditNotificationModalProps> = ({
  open,
  notification,
  onClose,
}) => {
  const { t } = useTranslation();
  const form = useNotificationForm();
  const update = useUpdateNotification();
  const { reset } = form;
  const { reset: resetMutation } = update;

  useEffect(() => {
    if (!open || !notification) return;
    reset(toNotificationForm(notification));
    resetMutation();
  }, [open, notification, reset, resetMutation]);

  const onSave = form.handleSubmit(async (body) => {
    if (!notification) return;
    await update.mutateAsync({ notificationId: notification._id, body }).then(
      () => {
        toast.success(t('messaging.notifications.updated'));
        onClose();
      },
      () => undefined,
    );
  });

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('messaging.notifications.editTitle')}
      onSave={() => void onSave()}
      saveLabel={t('messaging.notifications.saveChanges')}
      saving={update.isPending}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {update.error && <Alert severity="error">{update.error.message}</Alert>}
        {notification && <NotificationFormFields key={notification._id} form={form} />}
      </Stack>
    </AppModal>
  );
};

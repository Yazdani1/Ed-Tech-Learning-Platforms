import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';

import {
  notificationFormSchema,
  type Notification,
  type NotificationForm,
} from '@/schemas/notifications.schema';
import { userRoleSchema } from '@/schemas/auth.schema';

/** A new notification starts as Normal priority for students (as before). */
export const BLANK_NOTIFICATION: NotificationForm = {
  title: '',
  message: '',
  priority: 'Normal',
  targetRoles: ['Student'],
};

/** The edit form's values for an existing notification (unknown roles are dropped). */
export const toNotificationForm = (notification: Notification): NotificationForm => ({
  title: notification.title,
  message: notification.message,
  priority: notification.priority,
  targetRoles: notification.targetRoles.flatMap((role) => {
    const parsed = userRoleSchema.safeParse(role);
    return parsed.success ? [parsed.data] : [];
  }),
});

export const useNotificationForm = (): UseFormReturn<NotificationForm> =>
  useForm<NotificationForm>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: BLANK_NOTIFICATION,
  });

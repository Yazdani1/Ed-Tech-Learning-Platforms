import { z } from 'zod';

import { hasVisibleText } from '@/utils/html-text';

import { userRoleSchema } from './auth.schema';

// Notification shapes: what /api/notifications and the `notification:*` socket events really send.

export const NOTIFICATION_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const;
export const notificationPrioritySchema = z.enum(NOTIFICATION_PRIORITIES);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

/** Same limits as the backend's Notification model. */
export const NOTIFICATION_TITLE_MAX = 140;
export const NOTIFICATION_MESSAGE_MAX = 2000;

const sentBySchema = z.object({
  _id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  avatar: z.string().nullish(),
});

/**
 * One notification. The inbox adds the reader's own `isRead`/`readAt`; the sent list (Super Admin, Admin)
 * has neither. `message` is rich text (HTML): render it only through SafeHtml.
 */
export const notificationSchema = z.object({
  _id: z.string(),
  title: z.string(),
  message: z.string(),
  priority: notificationPrioritySchema.catch('Normal'),
  targetRoles: z.array(userRoleSchema.or(z.string())).default([]),
  sentBy: sentBySchema.nullish(),
  isRead: z.boolean().default(false),
  readAt: z.string().nullish(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof notificationSchema>;

/** GET /api/notifications/unread-count */
export const unreadCountSchema = z.object({ count: z.number() });

/** POST /api/notifications and PUT /api/notifications/:id body (validation messages are i18n keys). */
export const notificationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'validation.required')
    .max(NOTIFICATION_TITLE_MAX, 'messaging.notifications.form.titleTooLong'),
  message: z
    .string()
    .refine(hasVisibleText, 'validation.required')
    .refine(
      (html) => html.length <= NOTIFICATION_MESSAGE_MAX,
      'messaging.notifications.form.messageTooLong',
    ),
  priority: notificationPrioritySchema,
  targetRoles: z.array(userRoleSchema).min(1, 'messaging.notifications.form.rolesRequired'),
});
export type NotificationForm = z.infer<typeof notificationFormSchema>;

/** `notification:new` and `notification:updated` */
export const notificationEventSchema = z.object({ notification: notificationSchema });

/** `notification:deleted` */
export const notificationDeletedEventSchema = z.object({ notificationId: z.string() });

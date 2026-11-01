import { notificationSchema, type Notification } from '@/schemas/notifications.schema';

export const objectId = (suffix: string): string =>
  `64b7f0c2a1b2c3d4e5f6${suffix.padStart(4, '0')}`;

/** A notification as the backend sends it, checked against the app's schema. */
export const makeNotification = (overrides: Record<string, unknown> = {}): Notification =>
  notificationSchema.parse({
    _id: objectId('5001'),
    title: 'Exam schedule',
    message: '<p>The exam is on <strong>Monday</strong></p>',
    priority: 'High',
    targetRoles: ['Student'],
    sentBy: { _id: objectId('0001'), name: 'Nadia Admin', role: 'Admin' },
    isRead: false,
    readAt: null,
    createdAt: '2026-10-20T10:00:00.000Z',
    ...overrides,
  });

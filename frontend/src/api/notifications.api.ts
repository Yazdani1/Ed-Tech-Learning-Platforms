'use client';

import {
  keepPreviousData,
  useQuery,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  notificationSchema,
  unreadCountSchema,
  type Notification,
  type NotificationForm,
} from '@/schemas/notifications.schema';
import { http, type ApiError } from '@/services/http.service';

import { useInvalidatingMutation } from './invalidating-mutation';
import { queryKeys } from './query-keys';

import type { ListResult } from '@/types';

/** Same page size as the old notifications page. */
export const NOTIFICATIONS_PAGE_SIZE = 10;

const id = (value: string): string => encodeURIComponent(value);
const pageParams = (page: number) => ({ params: { page, limit: NOTIFICATIONS_PAGE_SIZE } });

export const getMyNotifications = (page: number): Promise<ListResult<Notification>> =>
  http.list('/api/notifications', notificationSchema, pageParams(page));

export const getUnreadNotificationCount = async (): Promise<number> =>
  (await http.get('/api/notifications/unread-count', unreadCountSchema)).count;

export const getSentNotifications = (page: number): Promise<ListResult<Notification>> =>
  http.list('/api/notifications/sent/all', notificationSchema, pageParams(page));

/** Resolves with the backend's message, e.g. "Notification sent to 12 users". */
export const createNotification = async (body: NotificationForm): Promise<string | undefined> =>
  (await http.send('POST', '/api/notifications', body)).message;

export const updateNotification = async ({
  notificationId,
  body,
}: {
  notificationId: string;
  body: NotificationForm;
}): Promise<void> => {
  await http.send('PUT', `/api/notifications/${id(notificationId)}`, body);
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await http.send('DELETE', `/api/notifications/${id(notificationId)}`);
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  await http.send('PATCH', `/api/notifications/${id(notificationId)}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await http.send('PATCH', '/api/notifications/read-all');
};

// ---- Hooks ----

export const useMyNotifications = (
  page: number,
): UseQueryResult<ListResult<Notification>, ApiError> =>
  useQuery({
    queryKey: queryKeys.notifications.minePage(page),
    queryFn: () => getMyNotifications(page),
    placeholderData: keepPreviousData,
  });

/** The signed-in user's unread count (top bar badge); kept fresh by the socket (useNotificationLiveSync). */
export const useUnreadNotificationCount = (enabled = true): UseQueryResult<number, ApiError> =>
  useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled,
  });

export const useSentNotifications = (
  page: number,
  enabled = true,
): UseQueryResult<ListResult<Notification>, ApiError> =>
  useQuery({
    queryKey: queryKeys.notifications.sentPage(page),
    queryFn: () => getSentNotifications(page),
    placeholderData: keepPreviousData,
    enabled,
  });

/** The inbox and the badge: what a read/unread change affects. */
const INBOX_KEYS = [queryKeys.notifications.mine, queryKeys.notifications.unreadCount] as const;
/** Sending, editing or deleting may reach the sender's own inbox too. */
const ALL_KEYS = [queryKeys.notifications.all] as const;

export const useCreateNotification = (): UseMutationResult<
  string | undefined,
  ApiError,
  NotificationForm
> => useInvalidatingMutation(createNotification, ALL_KEYS);

export const useUpdateNotification = (): UseMutationResult<
  void,
  ApiError,
  { notificationId: string; body: NotificationForm }
> => useInvalidatingMutation(updateNotification, ALL_KEYS);

export const useDeleteNotification = (): UseMutationResult<void, ApiError, string> =>
  useInvalidatingMutation(deleteNotification, ALL_KEYS);

export const useMarkNotificationRead = (): UseMutationResult<void, ApiError, string> =>
  useInvalidatingMutation(markNotificationRead, INBOX_KEYS);

export const useMarkAllNotificationsRead = (): UseMutationResult<void, ApiError, void> =>
  useInvalidatingMutation(markAllNotificationsRead, INBOX_KEYS);

/** Live changes (new, edited, deleted notification): refetch the inbox and the badge. */
export const refreshInbox = async (client: QueryClient): Promise<void> => {
  await Promise.all(INBOX_KEYS.map((queryKey) => client.invalidateQueries({ queryKey })));
};

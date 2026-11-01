'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { refreshInbox } from '@/api/notifications.api';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  notificationDeletedEventSchema,
  notificationEventSchema,
} from '@/schemas/notifications.schema';

/**
 * Live notifications for the whole signed-in area (mounted once by the shell): `notification:new`,
 * `notification:updated` and `notification:deleted` refresh the inbox and the unread badge.
 */
export const useNotificationLiveSync = (): void => {
  const client = useQueryClient();

  const onChange = useCallback(
    (payload: unknown) => {
      if (notificationEventSchema.safeParse(payload).success) void refreshInbox(client);
    },
    [client],
  );

  const onDeleted = useCallback(
    (payload: unknown) => {
      if (notificationDeletedEventSchema.safeParse(payload).success) void refreshInbox(client);
    },
    [client],
  );

  useSocketEvent('notification:new', onChange);
  useSocketEvent('notification:updated', onChange);
  useSocketEvent('notification:deleted', onDeleted);
};

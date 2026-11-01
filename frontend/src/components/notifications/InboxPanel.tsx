'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { useMarkNotificationRead, useMyNotifications } from '@/api/notifications.api';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';
import { toastError } from '@/utils/toast-error';

import { NotificationInboxHeader } from './NotificationInboxHeader';
import { NotificationCard } from './NotificationCard';
import { PANEL_SX } from './notification-styles';

import type { FC } from 'react';

interface InboxPanelProps {
  page: number;
  onPageChange: (page: number) => void;
}

/** "All Notifications": the user's own notifications, newest first; opening one marks it read. */
export const InboxPanel: FC<InboxPanelProps> = ({ page, onPageChange }) => {
  const { t } = useTranslation();
  const inbox = useMyNotifications(page);
  const markRead = useMarkNotificationRead();
  const items = inbox.data?.items ?? [];

  return (
    <Paper elevation={0} sx={PANEL_SX}>
      <NotificationInboxHeader />
      <Divider />
      <Box sx={{ p: 2 }}>
        <QueryState
          isLoading={inbox.isLoading}
          error={inbox.error}
          onRetry={() => void inbox.refetch()}
          isEmpty={items.length === 0}
          emptyText={t('messaging.notifications.empty')}
        >
          <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0 }}>
            {items.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                unread={!notification.isRead}
                onOpen={
                  notification.isRead
                    ? undefined
                    : () => {
                        markRead.mutateAsync(notification._id).catch(toastError);
                      }
                }
              />
            ))}
          </Stack>
          {inbox.data && (
            <ListPagination
              page={inbox.data.page}
              limit={inbox.data.limit}
              total={inbox.data.total}
              onPageChange={onPageChange}
            />
          )}
        </QueryState>
      </Box>
    </Paper>
  );
};

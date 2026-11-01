'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useSentNotifications } from '@/api/notifications.api';
import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';
import { ListPagination } from '@/components/common/ListPagination';
import { QueryState } from '@/components/common/QueryState';

import { NotificationCard } from './NotificationCard';
import { PANEL_SX } from './notification-styles';
import { useDeleteSentNotification } from './useDeleteSentNotification';

import type { Notification } from '@/schemas/notifications.schema';
import type { FC } from 'react';

interface SentPanelProps {
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (notification: Notification) => void;
}

/** "Sent Notifications" (Super Admin, Admin): every notification the admin team sent, to edit or delete. */
export const SentPanel: FC<SentPanelProps> = ({ page, onPageChange, onEdit }) => {
  const { t } = useTranslation();
  const sent = useSentNotifications(page);
  const onDelete = useDeleteSentNotification();
  const items = sent.data?.items ?? [];
  const roleLabels = (notification: Notification): string =>
    notification.targetRoles.map((role) => t(`messaging.notifications.roles.${role}`)).join(', ');

  return (
    <Paper elevation={0} sx={PANEL_SX}>
      <Box sx={{ p: 2.5 }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t('messaging.notifications.sentTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('messaging.notifications.sentSubtitle')}
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        <QueryState
          isLoading={sent.isLoading}
          error={sent.error}
          onRetry={() => void sent.refetch()}
          isEmpty={items.length === 0}
          emptyText={t('messaging.notifications.sentEmpty')}
        >
          <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0 }}>
            {items.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                chips={<Chip size="small" label={roleLabels(notification)} variant="outlined" />}
                menu={
                  <EditDeleteMenu
                    label={t('messaging.notifications.actionsFor', { title: notification.title })}
                    onEdit={() => {
                      onEdit(notification);
                    }}
                    onDelete={() => void onDelete(notification)}
                  />
                }
              />
            ))}
          </Stack>
          {sent.data && (
            <ListPagination
              page={sent.data.page}
              limit={sent.data.limit}
              total={sent.data.total}
              onPageChange={onPageChange}
            />
          )}
        </QueryState>
      </Box>
    </Paper>
  );
};

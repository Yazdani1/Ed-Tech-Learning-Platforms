'use client';

import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useMarkAllNotificationsRead, useUnreadNotificationCount } from '@/api/notifications.api';
import { useToastResult } from '@/hooks/useToastResult';

/** "All Notifications" heading with "Mark all read" (disabled when nothing is unread). */
export const NotificationInboxHeader = () => {
  const { t } = useTranslation();
  const toastResult = useToastResult();
  const unreadCount = useUnreadNotificationCount();
  const markAllRead = useMarkAllNotificationsRead();
  return (
    <Box
      sx={{
        p: 2.5,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <NotificationsActiveOutlinedIcon color="primary" />
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t('messaging.notifications.allTitle')}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        startIcon={<MarkEmailReadOutlinedIcon />}
        disabled={(unreadCount.data ?? 0) === 0 || markAllRead.isPending}
        onClick={() => {
          void toastResult(markAllRead.mutateAsync(), t('messaging.notifications.allRead'));
        }}
        sx={{ minHeight: 44, fontWeight: 700 }}
      >
        {t('messaging.notifications.markAllRead')}
      </Button>
    </Box>
  );
};

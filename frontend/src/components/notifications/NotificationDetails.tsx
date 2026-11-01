import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { SafeHtml } from '@/components/common/SafeHtml';

import type { Notification } from '@/schemas/notifications.schema';
import type { FC } from 'react';

interface NotificationDetailsProps {
  notification: Notification;
}

/** The opened part of a notification: its rich text message (sanitised) and who sent it. */
export const NotificationDetails: FC<NotificationDetailsProps> = ({ notification }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ px: 2.25, py: 1.75 }}>
      <SafeHtml html={notification.message} sx={{ fontSize: '0.875rem', lineHeight: 1.7, mb: 1 }} />
      <Typography variant="caption" color="text.secondary">
        {t('messaging.notifications.sentBy')}{' '}
        <Typography
          component="span"
          variant="caption"
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          {notification.sentBy?.name ?? t('messaging.notifications.adminFallback')}
        </Typography>
      </Typography>
    </Box>
  );
};

import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { PRIORITY_STYLES } from './notification-styles';

import type { Notification } from '@/schemas/notifications.schema';
import type { FC, ReactNode } from 'react';

interface NotificationSummaryProps {
  notification: Notification;
  unread: boolean;
  chips?: ReactNode;
}

/** The always-visible line of a notification: title, priority, "Unread", extra chips and the date. */
export const NotificationSummary: FC<NotificationSummaryProps> = ({
  notification,
  unread,
  chips,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <>
      <Typography
        component="span"
        sx={{
          fontWeight: unread ? 900 : 700,
          color: unread ? 'primary.main' : 'text.primary',
          fontSize: '0.9rem',
          wordBreak: 'break-word',
        }}
      >
        {notification.title}
      </Typography>
      <Chip
        size="small"
        label={t(`messaging.notifications.priority.${notification.priority}`)}
        color={PRIORITY_STYLES[notification.priority].color}
      />
      {unread && (
        <Chip
          size="small"
          label={t('messaging.notifications.unread')}
          color="primary"
          variant="outlined"
        />
      )}
      {chips}
      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
        {formatDateTime(notification.createdAt, i18n.language)}
      </Typography>
    </>
  );
};

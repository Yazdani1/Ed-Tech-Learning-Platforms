'use client';

import AlarmIcon from '@mui/icons-material/Alarm';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface ReminderAlarmAlertProps {
  /** Reminder title; the alert is hidden when null */
  title: string | null;
  onClose: () => void;
}

/** The alert at the top of the page when a reminder's start time arrives (stays until closed). */
export const ReminderAlarmAlert: FC<ReminderAlarmAlertProps> = ({ title, onClose }) => {
  const { t } = useTranslation();
  return (
    <Snackbar
      open={title !== null}
      onClose={(_event, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="warning"
        icon={<AlarmIcon />}
        onClose={onClose}
        role="alert"
        sx={{ width: '100%', fontWeight: 600 }}
      >
        {t('schedule.reminder.alarm', { title: title ?? '' })}
      </Alert>
    </Snackbar>
  );
};

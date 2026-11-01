'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface ReminderDatesProps {
  reminder: Schedule;
}

/** "Starts: ... Ends: ..." in the viewer's own time zone. */
export const ReminderDates: FC<ReminderDatesProps> = ({ reminder }) => {
  const { t, i18n } = useTranslation();
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        <strong>{t('schedule.reminder.starts')}</strong>{' '}
        {formatDateTime(reminder.startDateTime, i18n.language)}
      </Typography>
      {reminder.endDateTime && (
        <Typography variant="caption" color="text.secondary">
          <strong>{t('schedule.reminder.ends')}</strong>{' '}
          {formatDateTime(reminder.endDateTime, i18n.language)}
        </Typography>
      )}
    </Box>
  );
};

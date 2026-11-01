'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import type { Schedule } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface HistoryItemDatesProps {
  item: Schedule;
}

const NO_DATE = '—';

/** Timers: when they were completed. Reminders: when they started (and ended). */
export const HistoryItemDates: FC<HistoryItemDatesProps> = ({ item }) => {
  const { t, i18n } = useTranslation();
  const date = (value: string | null | undefined): string =>
    formatDateTime(value, i18n.language) || NO_DATE;

  if (item.type === 'timer') {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {t('schedule.history.completedOn', { date: date(item.completedAt ?? item.updatedAt) })}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
      <Typography variant="caption" color="text.secondary">
        {t('schedule.history.startedOn', { date: date(item.startDateTime) })}
      </Typography>
      {item.endDateTime && (
        <Typography variant="caption" color="text.secondary">
          {t('schedule.history.endedOn', { date: date(item.endDateTime) })}
        </Typography>
      )}
    </Box>
  );
};

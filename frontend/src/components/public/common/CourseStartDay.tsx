'use client';

import EventIcon from '@mui/icons-material/Event';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDate } from '@/utils/dateTime';

import type { FC } from 'react';

interface CourseStartDayProps {
  startDate: string | null | undefined;
}

/** "Starts Dec 5, 2026" (viewer's time zone and language), or "Start date to be announced". */
export const CourseStartDay: FC<CourseStartDayProps> = ({ startDate }) => {
  const { t, i18n } = useTranslation();
  const date = formatDate(startDate, i18n.language);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
      <EventIcon aria-hidden sx={{ fontSize: 18 }} />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {date ? t('public.courses.starts', { date }) : t('public.courses.startTba')}
      </Typography>
    </Box>
  );
};

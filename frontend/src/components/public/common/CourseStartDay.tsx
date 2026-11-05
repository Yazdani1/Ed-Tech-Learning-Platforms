'use client';

import EventIcon from '@mui/icons-material/Event';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { formatDate, isInPast } from '@/utils/dateTime';

import type { FC, ReactNode } from 'react';

interface CourseStartDayProps {
  startDate: string | null | undefined;
}

const CHIP_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  alignSelf: 'flex-start',
  columnGap: 0.75,
  rowGap: 0.25,
  px: 1.25,
  py: 0.5,
  borderRadius: 99,
  bgcolor: '#f1f3f6',
  color: '#334155',
  fontSize: '0.8rem',
} as const;
const ICON_SX = { fontSize: 16 } as const;

/** "Course Start Date:" with a coming date (viewer's time zone and language), or that it is still to come or open. */
export const CourseStartDay: FC<CourseStartDayProps> = ({ startDate }) => {
  const { t, i18n } = useTranslation();
  const date = formatDate(startDate, i18n.language);
  let icon: ReactNode = <EventIcon sx={{ ...ICON_SX, color: '#1d4ed8' }} aria-hidden />;
  let value = date;
  let hasDate = true;
  if (!date) {
    icon = <EventAvailableIcon sx={ICON_SX} aria-hidden />;
    value = t('public.courses.startTba');
    hasDate = false;
  } else if (isInPast(startDate)) {
    icon = <HowToRegOutlinedIcon sx={{ ...ICON_SX, color: '#047857' }} aria-hidden />;
    value = t('public.courses.registrationOpen');
    hasDate = false;
  }
  return (
    <Box sx={CHIP_SX}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {icon}
        {hasDate && t('public.courses.startDateLabel')}
      </Box>
      <Box component="span" sx={{ fontWeight: 700 }}>
        {value}
      </Box>
    </Box>
  );
};

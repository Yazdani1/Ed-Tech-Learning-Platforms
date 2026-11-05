'use client';

import EventIcon from '@mui/icons-material/Event';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { formatDate, isInPast } from '@/utils/dateTime';

import type { FC } from 'react';

interface CourseStartDayProps {
  startDate: string | null | undefined;
}

const CHIP_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  flexShrink: 0,
  ml: 'auto',
  px: 1,
  py: 0.5,
  borderRadius: 99,
  bgcolor: '#f1f3f6',
  color: '#334155',
  fontSize: '0.8rem',
  whiteSpace: 'nowrap',
} as const;
const ICON_SX = { fontSize: 16 } as const;

/** The card's date chip: the start date (viewer's time zone and language), or that it is still to come or open. */
export const CourseStartDay: FC<CourseStartDayProps> = ({ startDate }) => {
  const { t, i18n } = useTranslation();
  const date = formatDate(startDate, i18n.language);
  if (!date) {
    return (
      <Box sx={CHIP_SX}>
        <EventAvailableIcon sx={ICON_SX} aria-hidden />
        {t('public.courses.startTba')}
      </Box>
    );
  }
  if (isInPast(startDate)) {
    return (
      <Box sx={CHIP_SX}>
        <HowToRegOutlinedIcon sx={{ ...ICON_SX, color: '#047857' }} aria-hidden />
        {t('public.courses.registrationOpen')}
      </Box>
    );
  }
  return (
    <Box sx={CHIP_SX}>
      <EventIcon sx={{ ...ICON_SX, color: '#1d4ed8' }} aria-hidden />
      {date}
    </Box>
  );
};

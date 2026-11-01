'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatClock } from './schedule.utils';
import { CLOCK_FACE, CLOCK_FONT, RUNNING_TONE } from './schedule.theme';

import type { FC } from 'react';

interface ReminderCountdownProps {
  seconds: number;
}

/** Small "STARTS IN 00:12:30" badge of an upcoming reminder. */
export const ReminderCountdown: FC<ReminderCountdownProps> = ({ seconds }) => {
  const { t } = useTranslation();
  return (
    <Box
      role="timer"
      aria-label={t('schedule.reminder.startsIn')}
      sx={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: CLOCK_FACE,
        borderRadius: 1.5,
        px: 1.5,
        py: 0.5,
        border: `1px solid ${RUNNING_TONE.border}`,
      }}
    >
      <Typography
        sx={{
          color: RUNNING_TONE.digits,
          fontSize: 9,
          letterSpacing: 1.5,
          lineHeight: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {t('schedule.reminder.startsIn')}
      </Typography>
      <Typography
        sx={{
          fontFamily: CLOCK_FONT,
          fontSize: '0.85rem',
          fontWeight: 700,
          color: RUNNING_TONE.digits,
          letterSpacing: '0.06em',
          lineHeight: 1.1,
        }}
      >
        {formatClock(seconds)}
      </Typography>
    </Box>
  );
};

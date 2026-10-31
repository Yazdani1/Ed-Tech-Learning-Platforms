'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface WeekBadgeProps {
  number: number;
}

const BADGE_WIDTH = 64;

/** The orange "Week N" badge of a live class card (decorative: the card title says it too). */
export const WeekBadge: FC<WeekBadgeProps> = ({ number }) => {
  const { t } = useTranslation();
  return (
    <Box
      aria-hidden
      sx={{
        width: BADGE_WIDTH,
        py: 1.5,
        borderRadius: 1,
        bgcolor: 'warning.main',
        color: 'common.white',
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 800 }}>
        {t('catalog.liveClass.week')}
      </Typography>
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 900 }}>{number}</Typography>
    </Box>
  );
};

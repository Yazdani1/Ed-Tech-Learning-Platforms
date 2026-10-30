'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface WeekTileProps {
  /** Zero-based position of the week */
  index: number;
}

const WEEK_COLORS = ['#f59e0b', '#fb7c3c', '#0ea5e9'] as const;
const TILE_SX = {
  width: 64,
  minHeight: 72,
  borderRadius: 1,
  color: 'common.white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} as const;

/** Coloured "Week N" tile at the start of a live-class week. */
export const WeekTile: FC<WeekTileProps> = ({ index }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ ...TILE_SX, bgcolor: WEEK_COLORS[index % WEEK_COLORS.length] }}>
      <Typography component="span" sx={{ fontSize: '0.78rem', fontWeight: 800 }}>
        {t('browse.content.week')}
      </Typography>
      <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>
        {index + 1}
      </Typography>
    </Box>
  );
};

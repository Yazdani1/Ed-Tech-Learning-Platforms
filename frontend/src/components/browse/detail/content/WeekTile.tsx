'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { pickByIndex, WEEK_COLORS } from '../detail-styles';

import type { FC } from 'react';

interface WeekTileProps {
  /** Zero-based position of the week */
  index: number;
}

const TILE_SX = {
  width: 68,
  height: 68,
  borderRadius: '14px',
  color: 'common.white',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
} as const;

/** Gradient "Week N" tile at the start of a live-class week. */
export const WeekTile: FC<WeekTileProps> = ({ index }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ ...TILE_SX, background: pickByIndex(WEEK_COLORS, index).tile }}>
      <Typography
        component="span"
        sx={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}
      >
        {t('browse.content.week')}
      </Typography>
      <Typography component="span" sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1 }}>
        {index + 1}
      </Typography>
    </Box>
  );
};

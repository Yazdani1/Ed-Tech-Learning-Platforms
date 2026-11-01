'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useDurationText } from './useDurationText';

import type { FC } from 'react';

interface TotalBadgeProps {
  label: string;
  seconds: number;
  color: 'primary' | 'warning';
}

const TINT = 0.08;
const BORDER = 0.27;

/** "Total study time: 2h 15m" badge above a history list (hidden when 0). */
export const TotalBadge: FC<TotalBadgeProps> = ({ label, seconds, color }) => {
  const durationText = useDurationText();
  if (seconds <= 0) return null;
  return (
    <Box
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
        px: 2,
        py: 0.75,
        mb: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette[color].main, TINT),
        border: `1px solid ${alpha(theme.palette[color].main, BORDER)}`,
      })}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 900, color: `${color}.main`, fontFamily: 'monospace' }}>
        {durationText(seconds, false)}
      </Typography>
    </Box>
  );
};

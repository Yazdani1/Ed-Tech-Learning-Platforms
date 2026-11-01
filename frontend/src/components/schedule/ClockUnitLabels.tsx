'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { UNIT_LABEL_COLOR } from './schedule.theme';

import type { FC } from 'react';

interface ClockUnitLabelsProps {
  gap: number;
}

const UNIT_KEYS = ['hours', 'minutes', 'seconds'] as const;

/** The "HH MM SS" captions under the digits (hidden from screen readers: the timer has a label). */
export const ClockUnitLabels: FC<ClockUnitLabelsProps> = ({ gap }) => {
  const { t } = useTranslation();
  return (
    <Box aria-hidden sx={{ display: 'flex', justifyContent: 'center', gap, mt: 0.75 }}>
      {UNIT_KEYS.map((unit) => (
        <Typography
          key={unit}
          variant="caption"
          sx={{ color: UNIT_LABEL_COLOR, fontFamily: 'monospace', letterSpacing: 1.5 }}
        >
          {t(`schedule.clock.${unit}`)}
        </Typography>
      ))}
    </Box>
  );
};

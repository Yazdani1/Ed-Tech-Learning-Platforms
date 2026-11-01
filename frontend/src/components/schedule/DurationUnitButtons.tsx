'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { pad2, type DialMode } from './duration-dial';
import { CLOCK_FONT, DIAL_ACCENT, DIAL_ACCENT_HOVER } from './schedule.theme';

import type { DurationValue } from '@/schemas/schedule.schema';
import type { FC } from 'react';

interface DurationUnitButtonsProps {
  value: DurationValue;
  mode: DialMode;
  onModeChange: (mode: DialMode) => void;
}

const MODES: readonly DialMode[] = ['hours', 'minutes', 'seconds'];

const unitSx = (active: boolean) => ({
  px: 1.5,
  py: 0.5,
  minHeight: 44,
  minWidth: 64,
  borderRadius: 1.5,
  fontFamily: CLOCK_FONT,
  fontSize: '2rem',
  fontWeight: 700,
  color: active ? '#fff' : 'text.secondary',
  bgcolor: active ? DIAL_ACCENT : 'transparent',
  '&:hover': { bgcolor: active ? DIAL_ACCENT_HOVER : 'action.hover' },
});

const SEPARATOR_SX = {
  fontFamily: 'monospace',
  fontSize: '2rem',
  fontWeight: 700,
  color: 'text.disabled',
  mx: 0.25,
} as const;

/** "HH : MM : SS" read-out above the dial; tapping a unit makes the dial set that unit. */
export const DurationUnitButtons: FC<DurationUnitButtonsProps> = ({
  value,
  mode,
  onModeChange,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {MODES.map((unit, index) => (
        <Box key={unit} sx={{ display: 'flex', alignItems: 'center' }}>
          {index > 0 && (
            <Typography aria-hidden sx={SEPARATOR_SX}>
              :
            </Typography>
          )}
          <ButtonBase
            onClick={() => {
              onModeChange(unit);
            }}
            aria-pressed={mode === unit}
            aria-label={`${t('schedule.picker.editUnit', { unit: t(`schedule.picker.units.${unit}`) })}: ${value[unit]}`}
            sx={unitSx(mode === unit)}
          >
            {pad2(value[unit])}
          </ButtonBase>
        </Box>
      ))}
    </Box>
  );
};

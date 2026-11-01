'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  CENTER,
  DIAL_SIZE,
  DIAL_VIEWBOX,
  MAX_VALUE,
  handPosition,
  stepValue,
  valueAt,
  type DialMode,
} from './duration-dial';
import { DurationDialFace } from './DurationDialFace';
import { DurationUnitButtons } from './DurationUnitButtons';
import { DIAL_ACCENT } from './schedule.theme';

import type { DurationValue } from '@/schemas/schedule.schema';
import type { FC, KeyboardEvent, MouseEvent } from 'react';

interface DurationClockPickerProps {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
}

const NEXT_MODE: Record<DialMode, DialMode> = {
  hours: 'minutes',
  minutes: 'seconds',
  seconds: 'seconds',
};
const KEY_STEP: Partial<Record<string, number>> = {
  ArrowUp: 1,
  ArrowRight: 1,
  ArrowDown: -1,
  ArrowLeft: -1,
};
const CAPTION_SX = { color: 'text.secondary', letterSpacing: 1.5, fontSize: 10 } as const;

/**
 * Hours : minutes : seconds picker with a clock dial (as in the old page). Tap a unit, then the dial;
 * the dial also takes the arrow keys (it is a slider for screen readers and keyboards).
 */
export const DurationClockPicker: FC<DurationClockPickerProps> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<DialMode>('hours');
  const unitName = t(`schedule.picker.units.${mode}`);

  const handleClick = (event: MouseEvent<SVGSVGElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = DIAL_SIZE / rect.width;
    const x = (event.clientX - rect.left) * scale - CENTER;
    const y = (event.clientY - rect.top) * scale - CENTER;
    onChange({ ...value, [mode]: valueAt(mode, x, y) });
    setMode(NEXT_MODE[mode]);
  };

  const handleKey = (event: KeyboardEvent<SVGSVGElement>): void => {
    const step = KEY_STEP[event.key];
    if (step === undefined) return;
    event.preventDefault();
    onChange({ ...value, [mode]: stepValue(mode, value[mode], step) });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <DurationUnitButtons value={value} mode={mode} onModeChange={setMode} />
      <Typography variant="caption" sx={{ ...CAPTION_SX, textTransform: 'uppercase' }}>
        {t('schedule.picker.tapToSet', { unit: unitName })}
      </Typography>
      <Box
        sx={{
          width: '100%',
          maxWidth: DIAL_SIZE,
          lineHeight: 0,
          borderRadius: '50%',
          boxShadow: `0 0 0 3px ${DIAL_ACCENT}55, 0 8px 32px rgba(0,0,0,0.5)`,
        }}
      >
        <svg
          viewBox={DIAL_VIEWBOX}
          width="100%"
          role="slider"
          tabIndex={0}
          aria-label={t('schedule.picker.dialLabel', { unit: unitName })}
          aria-valuemin={0}
          aria-valuemax={MAX_VALUE[mode]}
          aria-valuenow={value[mode]}
          onClick={handleClick}
          onKeyDown={handleKey}
          style={{ cursor: 'pointer', borderRadius: '50%', display: 'block' }}
        >
          <DurationDialFace mode={mode} selected={value[mode]} hand={handPosition(value, mode)} />
        </svg>
      </Box>
      {mode === 'hours' && (
        <Typography variant="caption" sx={CAPTION_SX}>
          {t('schedule.picker.hoursHint')}
        </Typography>
      )}
    </Box>
  );
};

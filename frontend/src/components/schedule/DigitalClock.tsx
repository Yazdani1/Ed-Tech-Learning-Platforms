import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { ClockUnitLabels } from './ClockUnitLabels';
import { formatClock } from './schedule.utils';
import {
  CLOCK_FACE,
  CLOCK_FONT,
  RUNNING_TONE,
  UNIT_LABEL_COLOR,
  type ClockTone,
} from './schedule.theme';

import type { FC } from 'react';

type ClockSize = 'large' | 'medium';

interface DigitalClockProps {
  seconds: number;
  /** Accessible name, e.g. "Time left" (the digits are read with it) */
  label: string;
  /** Small caption above the digits (e.g. "STUDY TIME") */
  caption?: string;
  tone?: ClockTone;
  size?: ClockSize;
}

const DIGIT_SIZE: Record<ClockSize, { xs: string; sm: string }> = {
  large: { xs: '2.6rem', sm: '3.8rem' },
  medium: { xs: '1.6rem', sm: '1.7rem' },
};

/** The dark "digital clock" box with HH:MM:SS digits (timers and the reminder stopwatch). */
export const DigitalClock: FC<DigitalClockProps> = ({
  seconds,
  label,
  caption,
  tone = RUNNING_TONE,
  size = 'large',
}) => {
  const large = size === 'large';
  return (
    <Box
      role="timer"
      aria-label={label}
      sx={{
        background: CLOCK_FACE,
        borderRadius: 2,
        py: large ? 3 : 1.5,
        px: large ? 2 : 3,
        textAlign: 'center',
        border: `1px solid ${tone.border}`,
        boxShadow: `0 0 24px ${tone.glow}`,
        minWidth: large ? undefined : 200,
        maxWidth: '100%',
      }}
    >
      {caption && (
        <Typography
          variant="caption"
          sx={{ color: UNIT_LABEL_COLOR, letterSpacing: 2, display: 'block', mb: 0.25 }}
        >
          {caption}
        </Typography>
      )}
      <Typography
        sx={{
          fontFamily: CLOCK_FONT,
          fontSize: DIGIT_SIZE[size],
          fontWeight: 700,
          color: tone.digits,
          textShadow: `0 0 18px ${tone.glow}`,
          letterSpacing: '0.08em',
          lineHeight: 1,
        }}
      >
        {formatClock(seconds)}
      </Typography>
      <ClockUnitLabels gap={large ? 3 : 2.5} />
    </Box>
  );
};

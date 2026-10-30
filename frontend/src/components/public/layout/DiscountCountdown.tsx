'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { splitRemaining } from './countdown';

import type { FC } from 'react';

interface DiscountCountdownProps {
  /** When the offer ends (ISO date) */
  endsAt: string;
  /** Called once when the time is up, so the banner can hide */
  onEnded: () => void;
}

const TICK_MS = 1000;

/** "ENDS IN 2d 3h 4m 5s", updated every second. */
export const DiscountCountdown: FC<DiscountCountdownProps> = ({ endsAt, onEnded }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const remaining = new Date(endsAt).getTime() - now;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (remaining <= 0) onEnded();
  }, [remaining, onEnded]);

  const parts = splitRemaining(remaining);
  return (
    <Box
      role="timer"
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        bgcolor: 'rgba(17,24,39,0.82)',
        border: '1px solid rgba(255,255,255,0.22)',
        minWidth: 172,
        textAlign: 'center',
      }}
    >
      <Typography variant="caption" sx={{ display: 'block', color: '#fde68a', fontWeight: 900 }}>
        {t('public.banner.endsIn')}
      </Typography>
      <Typography variant="h6" component="p" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
        {t(parts.days > 0 ? 'public.banner.remainingDays' : 'public.banner.remaining', {
          ...parts,
        })}
      </Typography>
    </Box>
  );
};

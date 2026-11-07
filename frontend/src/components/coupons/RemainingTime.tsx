'use client';

import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { splitRemaining } from '@/components/public/layout/countdown';
import { MONO_FONT } from '@/theme/fonts';

import type { FC } from 'react';

interface RemainingTimeProps {
  startsAt?: string | null;
  endsAt?: string | null;
  /** Switched off by an admin */
  isActive: boolean;
}

const TICK_MS = 1000;
const DAY_MS = 86_400_000;

/** A live countdown of a coupon or promo: "Starts in …", "2d 3h 4m 5s left", "Ended" or "Switched off". */
export const RemainingTime: FC<RemainingTimeProps> = ({ startsAt, endsAt, isActive }) => {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, TICK_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  if (!isActive) return <Box component="span">{t('coupons.remaining.off')}</Box>;
  const start = startsAt ? new Date(startsAt).getTime() : 0;
  const end = endsAt ? new Date(endsAt).getTime() : Number.POSITIVE_INFINITY;
  if (now < start) {
    return (
      <Box component="span" role="timer" sx={{ color: 'info.main', fontFamily: MONO_FONT }}>
        {t('coupons.remaining.startsIn', {
          time: t('coupons.remaining.parts', { ...splitRemaining(start - now) }),
        })}
      </Box>
    );
  }
  if (end === Number.POSITIVE_INFINITY)
    return <Box component="span">{t('coupons.remaining.noEnd')}</Box>;
  if (now >= end)
    return (
      <Box component="span" sx={{ color: 'text.disabled' }}>
        {t('coupons.remaining.ended')}
      </Box>
    );
  return (
    <Box
      component="span"
      role="timer"
      sx={{
        color: end - now < DAY_MS ? 'error.main' : 'success.main',
        fontWeight: 700,
        fontFamily: MONO_FONT,
        whiteSpace: 'nowrap',
      }}
    >
      {t('coupons.remaining.left', {
        time: t('coupons.remaining.parts', { ...splitRemaining(end - now) }),
      })}
    </Box>
  );
};

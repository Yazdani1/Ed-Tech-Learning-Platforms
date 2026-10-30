'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActiveDiscount } from '@/api/public.api';

import { DiscountCountdown } from './DiscountCountdown';

const BANNER_GRADIENT =
  'linear-gradient(90deg, #7f1d1d 0%, #dc2626 28%, #f97316 58%, #facc15 100%)';
const ROW_SX = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  flexWrap: 'wrap',
  py: 1.25,
} as const;
const DARK = '#111827';

/** Red banner above the navbar while a course discount runs, with a live countdown. */
export const DiscountBanner = () => {
  const { t } = useTranslation();
  const { data: discount } = useActiveDiscount();
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const handleEnded = useCallback(() => {
    setEndedAt(discount?.discountEndsAt ?? null);
  }, [discount]);

  // The backend only sends offers that are still running; the countdown hides the banner when time is up
  if (!discount || endedAt === discount.discountEndsAt) return null;

  return (
    <Box
      component="aside"
      aria-label={t('public.banner.title')}
      sx={{ background: BANNER_GRADIENT, color: 'common.white' }}
    >
      <Container maxWidth="xl" sx={ROW_SX}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={t('public.banner.upTo', { percent: discount.discountPercent })}
            sx={{ bgcolor: DARK, color: '#fde68a', fontWeight: 900, height: 34 }}
          />
          <Box>
            <Typography
              variant="subtitle1"
              component="p"
              sx={{ fontWeight: 900, lineHeight: 1.15 }}
            >
              {t('public.banner.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', fontWeight: 700 }}>
              {t('public.banner.courseCount', { count: discount.courseCount })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <DiscountCountdown endsAt={discount.discountEndsAt} onEnded={handleEnded} />
          <Button
            component={Link}
            href="/courses"
            variant="contained"
            sx={{
              minHeight: 44,
              fontWeight: 900,
              bgcolor: DARK,
              color: '#fff7ed',
              '&:hover': { bgcolor: '#020617' },
            }}
          >
            {t('public.banner.cta')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActivePromos } from '@/api/promos.api';
import { PROMO_PAGE, promoDiscountLabel } from '@/components/promos/promo-format';
import { MONO_FONT } from '@/theme/fonts';

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
const CTA_SX = {
  minHeight: 44,
  fontWeight: 900,
  bgcolor: DARK,
  color: '#fff7ed',
  '&:hover': { bgcolor: '#020617' },
} as const;

/** Banner above the navbar while a promo runs: discount, title, code, live countdown, link to the promo page. */
export const DiscountBanner = () => {
  const { t } = useTranslation();
  const { data } = useActivePromos();
  const promo = data?.[0];
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const handleEnded = useCallback(() => {
    setEndedAt(promo?.endsAt ?? null);
  }, [promo]);

  // The backend only sends running promos; the countdown hides the banner when time is up
  if (!promo || endedAt === promo.endsAt) return null;

  return (
    <Box
      component="aside"
      aria-label={t('promos.banner.label')}
      sx={{ background: BANNER_GRADIENT, color: 'common.white' }}
    >
      <Container maxWidth="lg" sx={ROW_SX}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}
        >
          <Chip
            label={promoDiscountLabel(t, promo)}
            sx={{ bgcolor: DARK, color: '#fde68a', fontWeight: 900, height: 34 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              component="p"
              sx={{ fontWeight: 900, lineHeight: 1.15 }}
            >
              {promo.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>
              {t('promos.banner.useCode')}{' '}
              <Box component="span" sx={{ fontFamily: MONO_FONT, color: '#fff7ed' }}>
                {promo.code}
              </Box>{' '}
              · {t('public.banner.courseCount', { count: promo.courseCount })}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <DiscountCountdown endsAt={promo.endsAt} onEnded={handleEnded} />
          <Button component={Link} href={PROMO_PAGE} variant="contained" sx={CTA_SX}>
            {t('public.banner.cta')}
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

'use client';

import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActivePromos } from '@/api/promos.api';
import { AUTH_PARAM } from '@/utils/auth-drawer';
import { formatDateTime } from '@/utils/dateTime';

import { PromoCodeBox } from './PromoCodeBox';
import { PROMO_PAGE, promoDiscountLabel } from './promo-format';

const GRADIENT = 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 40%, #db2777 75%, #f97316 100%)';
const TITLE_ID = 'promo-popup-title';
const PAPER_SX = {
  borderRadius: '24px',
  overflow: 'hidden',
  background: GRADIENT,
  color: 'common.white',
  m: 2,
} as const;
const CLOSE_SX = {
  position: 'absolute',
  top: 8,
  right: 8,
  color: 'common.white',
  width: 44,
  height: 44,
} as const;
const ICON_SX = {
  width: 64,
  height: 64,
  mx: 'auto',
  mb: 2,
  borderRadius: '50%',
  display: 'grid',
  placeItems: 'center',
  bgcolor: 'rgba(255,255,255,0.18)',
} as const;
const CTA_SX = {
  mt: 3,
  minHeight: 52,
  fontWeight: 900,
  borderRadius: '14px',
  bgcolor: '#fde68a',
  color: '#3b0764',
  '&:hover': { bgcolor: '#fcd34d' },
} as const;

/**
 * Centre pop-up of a running promo, shown each time the home page or a course page opens: discount, code
 * (copy), start and end, and "Enroll now" (the promo courses page). Closing hides it until the next visit; it
 * stays closed while the sign-in panel is open. Uses the URL, so pages render it inside Suspense.
 */
export const PromoPopup = () => {
  const { t, i18n } = useTranslation();
  const { data } = useActivePromos();
  const [closed, setClosed] = useState(false);
  // The sign-in panel comes first (a signed-out visitor sent to sign in must not get the pop-up on top)
  const authOpen = useSearchParams().has(AUTH_PARAM);
  const promo = data?.[0];
  if (!promo || authOpen) return null;
  const close = (): void => {
    setClosed(true);
  };

  return (
    <Dialog
      open={!closed}
      onClose={close}
      maxWidth="xs"
      fullWidth
      aria-labelledby={TITLE_ID}
      slotProps={{ paper: { sx: PAPER_SX } }}
    >
      <IconButton aria-label={t('common.close')} onClick={close} sx={CLOSE_SX}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Box aria-hidden sx={ICON_SX}>
          <LocalOfferIcon sx={{ fontSize: 34 }} />
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: '2.4rem', lineHeight: 1.05 }}>
          {promoDiscountLabel(t, promo)}
        </Typography>
        <Typography
          id={TITLE_ID}
          component="h2"
          sx={{ fontWeight: 800, fontSize: '1.25rem', mt: 1 }}
        >
          {promo.title}
        </Typography>
        <PromoCodeBox code={promo.code} />
        <Typography variant="body2" sx={{ mt: 2, opacity: 0.92 }}>
          {t('promos.popup.dates', {
            start: formatDateTime(promo.startsAt, i18n.language),
            end: formatDateTime(promo.endsAt, i18n.language),
          })}
        </Typography>
        <Button
          component={Link}
          href={PROMO_PAGE}
          onClick={close}
          fullWidth
          variant="contained"
          size="large"
          sx={CTA_SX}
        >
          {t('promos.popup.enrollNow')}
        </Button>
      </Box>
    </Dialog>
  );
};

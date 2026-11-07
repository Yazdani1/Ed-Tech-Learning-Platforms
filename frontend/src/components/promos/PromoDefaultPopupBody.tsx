'use client';

import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { PromoCodeBox } from './PromoCodeBox';
import { PROMO_PAGE, promoDiscountLabel } from './promo-format';

import type { ActivePromo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface PromoDefaultPopupBodyProps {
  promo: ActivePromo;
  /** Id of the heading (the dialog is labelled by it) */
  titleId: string;
  onNavigate: () => void;
}

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

/** The default pop-up design: discount, title, code (copy), start and end, and "Enroll now". */
export const PromoDefaultPopupBody: FC<PromoDefaultPopupBodyProps> = ({
  promo,
  titleId,
  onNavigate,
}) => {
  const { t, i18n } = useTranslation();
  return (
    <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
      <Box aria-hidden sx={ICON_SX}>
        <LocalOfferIcon sx={{ fontSize: 34 }} />
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: '2.4rem', lineHeight: 1.05 }}>
        {promoDiscountLabel(t, promo)}
      </Typography>
      <Typography id={titleId} component="h2" sx={{ fontWeight: 800, fontSize: '1.25rem', mt: 1 }}>
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
        onClick={onNavigate}
        fullWidth
        variant="contained"
        size="large"
        sx={CTA_SX}
      >
        {t('promos.popup.enrollNow')}
      </Button>
    </Box>
  );
};

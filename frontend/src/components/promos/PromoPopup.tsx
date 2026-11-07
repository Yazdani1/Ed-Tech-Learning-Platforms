'use client';

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useActivePromos, usePromoDesign } from '@/api/promos.api';
import { VISUALLY_HIDDEN } from '@/theme/visually-hidden';
import { AUTH_PARAM } from '@/utils/auth-drawer';

import { PromoDefaultPopupBody } from './PromoDefaultPopupBody';
import { PromoImagePopupBody } from './PromoImagePopupBody';

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
  zIndex: 1,
  bgcolor: 'rgba(0,0,0,0.35)',
} as const;

/**
 * Centre pop-up of a running promo, shown each time the home page or a course page opens: discount, code
 * (copy), start and end, and "Enroll now" (the promo courses page). Closing hides it until the next visit; it
 * stays closed while the sign-in panel is open. Uses the URL, so pages render it inside Suspense.
 */
export const PromoPopup = () => {
  const { t } = useTranslation();
  const { data } = useActivePromos();
  const popupImage = usePromoDesign().data?.popupImage;
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
      {popupImage ? (
        <>
          <Typography id={TITLE_ID} component="h2" sx={VISUALLY_HIDDEN}>
            {promo.title}
          </Typography>
          <PromoImagePopupBody promo={promo} imageUrl={popupImage} onNavigate={close} />
        </>
      ) : (
        <PromoDefaultPopupBody promo={promo} titleId={TITLE_ID} onNavigate={close} />
      )}
    </Dialog>
  );
};

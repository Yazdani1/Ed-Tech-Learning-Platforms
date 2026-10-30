'use client';

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import DevicesIcon from '@mui/icons-material/Devices';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';

import { formatBdt, type PriceInfo } from '@/utils/price';
import { IconTextList } from '../IconTextList';

import { GuestSignUpButtons } from './GuestSignUpButtons';

import type { FC } from 'react';

interface DirectPurchaseActionsProps {
  price: PriceInfo;
  isStudent: boolean;
  isSignedIn: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}

const ICON_SX = { fontSize: 15 } as const;

/** Under the direct price: perks, then Enroll / Buy for students, or Register + Sign in for guests. */
export const DirectPurchaseActions: FC<DirectPurchaseActionsProps> = ({
  price,
  isStudent,
  isSignedIn,
  enrolling,
  onEnroll,
}) => {
  const { t } = useTranslation();
  const perks = [
    { icon: <WorkspacePremiumIcon sx={ICON_SX} />, text: t('browse.enroll.certificate') },
    { icon: <AllInclusiveIcon sx={ICON_SX} />, text: t('browse.enroll.lifetime') },
    { icon: <DevicesIcon sx={ICON_SX} />, text: t('browse.enroll.anyDevice') },
  ];
  let buyLabel = t('browse.enroll.buyNow');
  if (price.isFree) buyLabel = t('browse.enroll.enrollNowFree');
  else if (price.hasDiscount) {
    buyLabel = t('browse.enroll.buyNowPrice', { price: formatBdt(price.discountPrice) });
  }

  return (
    <>
      <IconTextList items={perks} dense />
      <Box sx={{ mt: 1.5 }}>
        {isStudent && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            disabled={enrolling}
            onClick={onEnroll}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            {enrolling ? (
              <CircularProgress size={22} color="inherit" aria-label={t('common.loading')} />
            ) : (
              buyLabel
            )}
          </Button>
        )}
        {!isSignedIn && <GuestSignUpButtons isFree={price.isFree} />}
      </Box>
    </>
  );
};

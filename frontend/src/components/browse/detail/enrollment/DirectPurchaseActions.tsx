'use client';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { ENROLL_ATTENTION_SX } from './enroll-attention';
import { EnrollmentPerks } from './EnrollmentPerks';
import { paymentHref } from './EnrollNowButton';
import { GuestSignUpButtons } from './GuestSignUpButtons';

import type { PriceInfo } from '@/utils/price';
import type { FC } from 'react';

interface DirectPurchaseActionsProps {
  courseId: string;
  price: PriceInfo;
  isStudent: boolean;
  isSignedIn: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}

const BUTTON_SX = {
  minHeight: 54,
  fontWeight: 700,
  fontSize: '1.05rem',
  borderRadius: '10px',
  bgcolor: '#2563eb',
  '&:hover': { bgcolor: '#1d4ed8' },
} as const;

/**
 * Under the direct price: a paid course goes to the payment details page (the visitor signs in there); a
 * student enrols in a free course here, a visitor signs up first. Then the perks.
 */
export const DirectPurchaseActions: FC<DirectPurchaseActionsProps> = ({
  courseId,
  price,
  isStudent,
  isSignedIn,
  enrolling,
  onEnroll,
}) => {
  const { t } = useTranslation();
  const canBuy = !price.isFree && (isStudent || !isSignedIn);

  return (
    <>
      <Box sx={{ mt: 2.5 }}>
        {canBuy && (
          <Button
            component={Link}
            href={paymentHref(courseId)}
            fullWidth
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ ...BUTTON_SX, ...ENROLL_ATTENTION_SX }}
          >
            {t('browse.buyBar.enroll')}
          </Button>
        )}
        {price.isFree && isStudent && (
          <Button
            fullWidth
            variant="contained"
            disabled={enrolling}
            onClick={onEnroll}
            sx={BUTTON_SX}
          >
            {enrolling ? (
              <CircularProgress size={22} color="inherit" aria-label={t('common.loading')} />
            ) : (
              t('browse.enroll.enrollNowFree')
            )}
          </Button>
        )}
        {price.isFree && !isSignedIn && <GuestSignUpButtons />}
      </Box>
      <EnrollmentPerks />
    </>
  );
};

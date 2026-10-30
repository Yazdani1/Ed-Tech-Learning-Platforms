'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';

interface GuestSignUpButtonsProps {
  isFree: boolean;
}

const BUTTON_SX = { fontWeight: 700, borderRadius: 2 } as const;

/** Visitors: create an account ("Enroll Free" / "Get Started") or sign in. */
export const GuestSignUpButtons: FC<GuestSignUpButtonsProps> = ({ isFree }) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={1}>
      <Button
        component={Link}
        href="/auth/register"
        fullWidth
        variant="contained"
        size="large"
        sx={BUTTON_SX}
      >
        {isFree ? t('browse.enroll.enrollFreeGuest') : t('browse.enroll.getStarted')}
      </Button>
      <Button
        component={Link}
        href="/auth/login"
        fullWidth
        variant="outlined"
        size="large"
        sx={BUTTON_SX}
      >
        {t('browse.enroll.signIn')}
      </Button>
    </Stack>
  );
};

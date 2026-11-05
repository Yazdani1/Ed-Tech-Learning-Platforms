'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const BUTTON_SX = { fontWeight: 700, borderRadius: '10px', minHeight: 48 } as const;

/** Visitors on a free course: create an account ("Enroll Free") or sign in. */
export const GuestSignUpButtons = () => {
  const { t } = useTranslation();
  return (
    <Stack spacing={1}>
      <Button component={Link} href="/auth/register" fullWidth variant="contained" sx={BUTTON_SX}>
        {t('browse.enroll.enrollFreeGuest')}
      </Button>
      <Button component={Link} href="/auth/login" fullWidth variant="outlined" sx={BUTTON_SX}>
        {t('browse.enroll.signIn')}
      </Button>
    </Stack>
  );
};

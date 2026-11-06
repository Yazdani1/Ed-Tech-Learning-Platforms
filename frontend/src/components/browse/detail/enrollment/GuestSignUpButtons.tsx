'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { withAuthPanel } from '@/utils/auth-drawer';

const BUTTON_SX = { fontWeight: 700, borderRadius: '10px', minHeight: 48 } as const;

/** Visitors on a free course: create an account ("Enroll Free") or sign in. */
export const GuestSignUpButtons = () => {
  const { t } = useTranslation();
  // The panel opens on this course page and comes back here after signing in
  const pathname = usePathname();
  return (
    <Stack spacing={1}>
      <Button
        component={Link}
        href={withAuthPanel(pathname, '', 'register', pathname)}
        scroll={false}
        fullWidth
        variant="contained"
        sx={BUTTON_SX}
      >
        {t('browse.enroll.enrollFreeGuest')}
      </Button>
      <Button
        component={Link}
        href={withAuthPanel(pathname, '', 'login', pathname)}
        scroll={false}
        fullWidth
        variant="outlined"
        sx={BUTTON_SX}
      >
        {t('browse.enroll.signIn')}
      </Button>
    </Stack>
  );
};

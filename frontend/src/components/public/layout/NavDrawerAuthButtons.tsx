'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { withAuthPanel } from '@/utils/auth-drawer';
import { ROLE_HOME } from '@/utils/roles';

import type { FC } from 'react';

interface NavDrawerAuthButtonsProps {
  onNavigate: () => void;
}

/** Bottom of the phone menu: Dashboard when signed in, otherwise Sign In / Sign Up (the auth panel). */
export const NavDrawerAuthButtons: FC<NavDrawerAuthButtonsProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  return (
    <Stack spacing={1} sx={{ p: 1 }}>
      {user ? (
        <Button
          component={Link}
          href={ROLE_HOME[user.role]}
          variant="outlined"
          onClick={onNavigate}
        >
          {t('public.nav.dashboard')}
        </Button>
      ) : (
        <>
          <Button
            component={Link}
            href={withAuthPanel(pathname, '', 'login')}
            scroll={false}
            variant="outlined"
            onClick={onNavigate}
          >
            {t('public.nav.signIn')}
          </Button>
          <Button
            component={Link}
            href={withAuthPanel(pathname, '', 'register')}
            scroll={false}
            variant="contained"
            onClick={onNavigate}
          >
            {t('public.nav.signUp')}
          </Button>
        </>
      )}
    </Stack>
  );
};

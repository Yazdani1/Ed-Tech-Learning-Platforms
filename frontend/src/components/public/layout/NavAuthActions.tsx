'use client';

import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/utils/roles';

/** Hidden on the smallest phones: the menu drawer has the same buttons there. */
const FROM_SM = {
  display: { xs: 'none', sm: 'inline-flex' },
  minHeight: 44,
  fontWeight: 600,
} as const;
const AVATAR_SIZE = 36;

/** Right side of the navbar: dashboard link + avatar when signed in, otherwise Sign In / Sign Up. */
export const NavAuthActions = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Skeleton variant="circular" width={AVATAR_SIZE} height={AVATAR_SIZE} />;
  }

  if (user) {
    return (
      <>
        <Button component={Link} href={ROLE_HOME[user.role]} variant="outlined" sx={FROM_SM}>
          {t('public.nav.dashboard')}
        </Button>
        <Tooltip title={user.name}>
          <Avatar
            alt={user.name}
            sx={{ width: AVATAR_SIZE, height: AVATAR_SIZE, bgcolor: 'primary.main', fontSize: 14 }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
        </Tooltip>
      </>
    );
  }

  return (
    <>
      <Button component={Link} href="/auth/login" variant="outlined" sx={FROM_SM}>
        {t('public.nav.signIn')}
      </Button>
      <Button component={Link} href="/auth/register" variant="contained" sx={FROM_SM}>
        {t('public.nav.signUp')}
      </Button>
    </>
  );
};

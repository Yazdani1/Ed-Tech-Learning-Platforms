'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { SideDrawer } from '@/components/common/SideDrawer';
import { useAuth } from '@/hooks/useAuth';
import { AUTH_PARAM, NEXT_PARAM, isAuthMode, withoutAuthPanel } from '@/utils/auth-drawer';
import { postLoginPath } from '@/utils/safe-redirect';

import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

/**
 * The sign-in / create-account panel on the right, on every page (?auth=login|register in the URL). It is the
 * ONE place that navigates after signing in: to the safe ?next= page the role may open, else the role's home.
 */
export const AuthDrawer = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const mode = searchParams.get(AUTH_PARAM);
  const next = searchParams.get(NEXT_PARAM);
  const open = isAuthMode(mode);

  useEffect(() => {
    if (open && user) router.replace(postLoginPath(user.role, next));
  }, [open, user, next, router]);

  const close = (): void => {
    router.replace(withoutAuthPanel(pathname, searchParams.toString()), { scroll: false });
  };

  return (
    <SideDrawer
      open={open && !user}
      onClose={close}
      title={t(mode === 'register' ? 'public.nav.signUp' : 'public.nav.signIn')}
      hideActions
    >
      {mode === 'register' ? <RegisterForm /> : <LoginForm />}
    </SideDrawer>
  );
};

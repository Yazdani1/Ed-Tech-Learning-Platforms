'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, type FC, type ReactNode } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { useAuth } from '@/hooks/useAuth';
import { postLoginPath } from '@/utils/safe-redirect';

interface GuestGateProps {
  children: ReactNode;
}

/**
 * Shows the sign-in/register pages only to visitors who are not signed in. It is also the ONE place that
 * navigates after signing in: the forms only update the signed-in user, and this sends the user to the
 * safe ?next= page their role may open, or to their role's home page.
 */
export const GuestGate: FC<GuestGateProps> = ({ children }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const next = searchParams.get('next');

  useEffect(() => {
    if (user) router.replace(postLoginPath(user.role, next));
  }, [user, next, router]);

  return isLoading || user ? <FullPageLoader /> : <>{children}</>;
};

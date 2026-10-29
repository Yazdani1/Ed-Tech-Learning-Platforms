'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type FC, type ReactNode } from 'react';

import { FullPageLoader } from '@/components/common/FullPageLoader';
import { ErrorView } from '@/components/errors/ErrorView';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_HOME } from '@/utils/roles';

import type { UserRole } from '@/types';

interface RequireRoleProps {
  roles: readonly UserRole[];
  children: ReactNode;
  /** Where a signed-in user without the role goes (default: their own home page). */
  fallbackPath?: string;
}

/**
 * Renders a page only for these roles. It is the ONE place that leaves a signed-in page:
 * - a visitor who opens the page signed out goes to /auth/login?next=<this page>;
 * - a user who signs out (or whose session ends) here goes to /auth/login without ?next=, so the next
 *   person on a shared computer does not land on the previous user's page;
 * - other roles go to their home page.
 * This only shapes the UI; the backend's protect/authorize is the security boundary.
 */
export const RequireRole: FC<RequireRoleProps> = ({ roles, children, fallbackPath }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, error, retry, hasRole } = useAuth();
  const wasSignedIn = useRef(false);
  const allowed = hasRole(roles);

  useEffect(() => {
    if (user) wasSignedIn.current = true;
  }, [user]);

  useEffect(() => {
    if (isLoading || allowed || error) return;
    if (user) {
      router.replace(fallbackPath ?? ROLE_HOME[user.role]);
    } else if (wasSignedIn.current) {
      router.replace('/auth/login');
    } else {
      const next = `${pathname}${window.location.search}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
    }
  }, [isLoading, allowed, error, user, router, pathname, fallbackPath]);

  if (allowed) return <>{children}</>;
  return error ? <ErrorView onRetry={retry} /> : <FullPageLoader />;
};

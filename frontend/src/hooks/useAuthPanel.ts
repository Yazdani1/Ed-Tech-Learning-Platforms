'use client';

import { usePathname, useRouter } from 'next/navigation';

import { NEXT_PARAM, withAuthPanel, type AuthMode } from '@/utils/auth-drawer';

export interface AuthPanel {
  /** Opens the sign-in / create-account panel on this page; `next` = where to go after signing in */
  open: (mode: AuthMode, next?: string) => void;
}

/**
 * Opens the auth panel (it lives in the app shell and reads the URL). The current query is read at click
 * time, so pages using this need no Suspense boundary.
 */
export const useAuthPanel = (): AuthPanel => {
  const router = useRouter();
  const pathname = usePathname();
  return {
    open: (mode, next) => {
      const { search } = window.location;
      const keepNext = next ?? new URLSearchParams(search).get(NEXT_PARAM);
      router.push(withAuthPanel(pathname, search, mode, keepNext), { scroll: false });
    },
  };
};

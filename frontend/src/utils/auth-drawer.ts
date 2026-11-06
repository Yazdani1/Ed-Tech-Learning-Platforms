import { safeRedirectPath } from './safe-redirect';

// Sign in and create account open as a right-side panel on the current page, driven by the URL:
// ?auth=login|register and an optional safe ?next= (where to go after signing in).

export const AUTH_PARAM = 'auth';
export const NEXT_PARAM = 'next';
export type AuthMode = 'login' | 'register';

export const isAuthMode = (value: string | null): value is AuthMode =>
  value === 'login' || value === 'register';

/** `path` + `search` with the panel open in `mode` (and a safe `next`, when given). */
export const withAuthPanel = (
  path: string,
  search: string,
  mode: AuthMode,
  next?: string | null,
): string => {
  const params = new URLSearchParams(search);
  params.set(AUTH_PARAM, mode);
  const safe = safeRedirectPath(next ?? null);
  if (safe) params.set(NEXT_PARAM, safe);
  else params.delete(NEXT_PARAM);
  return `${path}?${params.toString()}`;
};

/** `path` + `search` without the panel parameters. */
export const withoutAuthPanel = (path: string, search: string): string => {
  const params = new URLSearchParams(search);
  params.delete(AUTH_PARAM);
  params.delete(NEXT_PARAM);
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
};

/** A signed-in page opened signed out: the home page with the sign-in panel and the way back. */
export const signInRedirect = (next?: string | null): string =>
  withAuthPanel('/', '', 'login', next);

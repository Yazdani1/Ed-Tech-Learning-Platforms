import { canOpenPath, ROLE_HOME } from './roles';

import type { UserRole } from '@/types';

/** Placeholder origin used only to resolve and normalise a path; never contacted. */
const LOCAL_ORIGIN = 'http://local.invalid';
const FIRST_PRINTABLE_CODE = 0x20;
const DELETE_CODE = 0x7f;

/** Control characters (browsers silently drop tab/CR/LF in URLs) and backslashes (read as "/"). */
const hasUnsafeCharacter = (value: string): boolean => {
  if (value.includes('\\')) return true;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < FIRST_PRINTABLE_CODE || code === DELETE_CODE) return true;
  }
  return false;
};

/**
 * Only same-site paths are allowed as a ?next= target. "/student/courses" yes; "https://evil.example",
 * "//evil.example", "/\evil.example" and "/<tab>/evil.example" (all read by browsers as another site) no.
 * Returns the normalised path ("/student/../admin" becomes "/admin") so role checks see the real page.
 */
export const safeRedirectPath = (next: string | null): string | null => {
  if (!next?.startsWith('/') || hasUnsafeCharacter(next)) return null;
  const url = new URL(next, LOCAL_ORIGIN);
  return url.origin === LOCAL_ORIGIN ? `${url.pathname}${url.search}${url.hash}` : null;
};

/** Where to go after signing in: the safe ?next= page if this role may open it, else the role's home. */
export const postLoginPath = (role: UserRole, next: string | null): string => {
  const safe = safeRedirectPath(next);
  return safe && canOpenPath(role, safe) ? safe : ROLE_HOME[role];
};

import { NextResponse, type NextRequest } from 'next/server';

import { buildCsp } from './utils/csp';

/** The backend's httpOnly session cookie (backend/src/utils/jwt.ts). */
const SESSION_COOKIE = 'token';
/** Signed-in areas: visitors without the session cookie are sent to sign in first. */
const SIGNED_IN_AREA = /^\/(?:admin|student|teacher)(?:\/|$)/;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Runs before every page:
 * 1. Optimistic sign-in check: no session cookie on /admin, /student or /teacher -> /auth/login?next=<page>.
 *    The backend still verifies the token on every API call and RequireRole checks the role; this is not
 *    the security boundary.
 * 2. A fresh CSP nonce per request (Next.js adds it to its own scripts during rendering).
 */
export const proxy = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;
  if (SIGNED_IN_AREA.test(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp({ nonce, isDev: IS_DEV, socketUrl: SOCKET_URL });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
};

export const config = {
  matcher: [
    {
      // Every page: not the /api proxy, Next.js build files or the favicon. Link prefetches are skipped
      // (they render no HTML that needs a nonce).
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};

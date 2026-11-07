import { NextResponse, type NextRequest } from 'next/server';

import { signInRedirect } from './utils/auth-drawer';
import { buildCsp } from './utils/csp';

/** The backend's httpOnly session cookie (backend/src/utils/jwt.ts). */
const SESSION_COOKIE = 'token';
/** Signed-in areas: visitors without the session cookie are sent to sign in first. */
const SIGNED_IN_AREA = /^\/(?:admin|student|teacher)(?:\/|$)/;
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
const IS_DEV = process.env.NODE_ENV === 'development';
/** Server-only secret shared with the backend: it trusts X-Client-IP only together with it. */
const PROXY_SHARED_SECRET = process.env.PROXY_SHARED_SECRET ?? '';
const CLIENT_IP_HEADER = 'x-client-ip';
const PROXY_SECRET_HEADER = 'x-proxy-secret';

/**
 * /api calls go on to the backend (next.config rewrite). Its rate limits need the visitor's IP, but it only
 * sees this server's address: pass the IP Vercel measured (x-real-ip / first x-forwarded-for) with the shared
 * secret. Whatever the browser sent in these headers is dropped first.
 */
const forwardClientIp = (request: NextRequest): NextResponse => {
  const headers = new Headers(request.headers);
  headers.delete(CLIENT_IP_HEADER);
  headers.delete(PROXY_SECRET_HEADER);
  const ip =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (PROXY_SHARED_SECRET && ip) {
    headers.set(CLIENT_IP_HEADER, ip);
    headers.set(PROXY_SECRET_HEADER, PROXY_SHARED_SECRET);
  }
  return NextResponse.next({ request: { headers } });
};

/**
 * Runs before every page:
 * 1. Optimistic sign-in check: no session cookie on /admin, /student or /teacher -> the home page with the
 *    sign-in panel (?auth=login&next=<page>).
 *    The backend still verifies the token on every API call and RequireRole checks the role; this is not
 *    the security boundary.
 * 2. A fresh CSP nonce per request (Next.js adds it to its own scripts during rendering).
 * 3. /api calls: the visitor's IP for the backend's rate limits (forwardClientIp).
 */
export const proxy = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith('/api/')) return forwardClientIp(request);
  if (SIGNED_IN_AREA.test(pathname) && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL(signInRedirect(`${pathname}${search}`), request.url));
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
    '/api/:path*',
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

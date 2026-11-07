// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxy } from '../proxy';

const request = (path: string, cookie?: string): NextRequest =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });

describe('proxy', () => {
  it.each(['/admin/courses', '/student/courses', '/teacher', '/admin'])(
    'sends a visitor without the session cookie from %s to sign in',
    (path) => {
      const response = proxy(request(`${path}?tab=2`));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location') ?? '');
      expect(location.pathname).toBe('/');
      expect(location.searchParams.get('auth')).toBe('login');
      expect(location.searchParams.get('next')).toBe(`${path}?tab=2`);
    },
  );

  it('lets a visitor with the session cookie through, with a fresh CSP nonce', () => {
    const first = proxy(request('/admin/courses', 'token=abc'));
    const second = proxy(request('/admin/courses', 'token=abc'));

    expect(first.headers.get('location')).toBeNull();
    const csp = first.headers.get('content-security-policy') ?? '';
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).not.toBe(second.headers.get('content-security-policy'));
  });

  it.each(['/', '/auth/login', '/courses/123', '/administrator'])(
    'never redirects the public page %s',
    (path) => {
      const response = proxy(request(path));

      expect(response.headers.get('location')).toBeNull();
      expect(response.headers.get('content-security-policy')).toContain("'strict-dynamic'");
    },
  );

  describe('/api calls', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    const apiRequest = (headers: Record<string, string>): NextRequest =>
      new NextRequest('http://localhost:3000/api/auth/login', { headers });
    /** NextResponse.next({ request: { headers } }) carries the new request headers like this */
    const forwarded = (response: Response, name: string): string | null =>
      response.headers.get(`x-middleware-request-${name}`);

    it('passes the visitor IP with the shared secret, never what the browser sent', async () => {
      vi.stubEnv('PROXY_SHARED_SECRET', 'shared-test-secret');
      vi.resetModules();
      const { proxy: withSecret } = await import('../proxy');
      const response = withSecret(
        apiRequest({
          'x-forwarded-for': '203.0.113.7, 10.0.0.1',
          'x-client-ip': '1.1.1.1',
          'x-proxy-secret': 'guess',
        }),
      );
      expect(response.headers.get('location')).toBeNull();
      expect(forwarded(response, 'x-client-ip')).toBe('203.0.113.7');
      expect(forwarded(response, 'x-proxy-secret')).toBe('shared-test-secret');
      expect(response.headers.get('content-security-policy')).toBeNull();
    });

    it('without the secret only drops the headers the browser sent', async () => {
      vi.stubEnv('PROXY_SHARED_SECRET', '');
      vi.resetModules();
      const { proxy: withoutSecret } = await import('../proxy');
      const response = withoutSecret(
        apiRequest({
          'x-real-ip': '203.0.113.7',
          'x-client-ip': '1.1.1.1',
          'x-proxy-secret': 'guess',
        }),
      );
      expect(forwarded(response, 'x-client-ip')).toBeNull();
      expect(forwarded(response, 'x-proxy-secret')).toBeNull();
      expect(response.headers.get('x-middleware-override-headers') ?? '').not.toContain(
        'x-client-ip,',
      );
    });
  });
});

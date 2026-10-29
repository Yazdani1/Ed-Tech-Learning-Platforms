// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from '../proxy';

const request = (path: string, cookie?: string): NextRequest =>
  new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  });

describe('proxy', () => {
  it.each(['/admin/courses', '/student/dashboard', '/teacher', '/admin'])(
    'sends a visitor without the session cookie from %s to sign in',
    (path) => {
      const response = proxy(request(`${path}?tab=2`));

      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location') ?? '');
      expect(location.pathname).toBe('/auth/login');
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
});

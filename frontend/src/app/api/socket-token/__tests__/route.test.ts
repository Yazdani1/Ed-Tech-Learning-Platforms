/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../route';

const cookieValue = vi.hoisted(() => ({ current: undefined as string | undefined }));

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === 'token' && cookieValue.current !== undefined
          ? { name, value: cookieValue.current }
          : undefined,
    }),
}));

describe('GET /api/socket-token', () => {
  beforeEach(() => {
    cookieValue.current = undefined;
  });

  it('answers with the session token from the httpOnly cookie, never cached', async () => {
    cookieValue.current = 'jwt-from-cookie';

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { token: 'jwt-from-cookie' } });
    expect(res.headers.get('cache-control')).toContain('no-store');
  });

  it('answers 401 when nobody is signed in', async () => {
    const res = await GET();

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ success: false, message: 'Not authorized, please login' });
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
});

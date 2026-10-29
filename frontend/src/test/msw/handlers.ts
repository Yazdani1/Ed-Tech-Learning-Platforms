import { http, HttpResponse } from 'msw';

import { userSchema, type User } from '@/schemas/auth.schema';

import type { UserRole } from '@/types';

const USER_IDS: Record<UserRole, string> = {
  'Super Admin': '64b7f0c2a1b2c3d4e5f60001',
  Admin: '64b7f0c2a1b2c3d4e5f60002',
  Moderator: '64b7f0c2a1b2c3d4e5f60003',
  Teacher: '64b7f0c2a1b2c3d4e5f60004',
  Student: '64b7f0c2a1b2c3d4e5f60005',
};

/** A user as the backend returns it, checked against the same schema the app uses. */
export const makeUser = (role: UserRole, overrides: Partial<User> = {}): User =>
  userSchema.parse({
    _id: USER_IDS[role],
    name: `Test ${role}`,
    email: `${role.toLowerCase().replace(' ', '.')}@example.com`,
    role,
    ...overrides,
  });

/** The backend's success envelope. */
export const ok = (data: unknown, extra: Record<string, unknown> = {}): Response =>
  HttpResponse.json({ success: true, data, ...extra });

/** The backend's error shape ({ success: false, message }) with an HTTP status. */
export const fail = (status: number, message: string): Response =>
  HttpResponse.json({ success: false, message }, { status });

/** Default API behaviour: nobody signed in. Tests add their own handlers with server.use(...). */
export const handlers = [
  http.get('*/api/auth/me', () => fail(401, 'Not authorized, please login')),
];

/** The "me" endpoint answering with this user (signed in). */
export const signedInAs = (user: User) => http.get('*/api/auth/me', () => ok(user));

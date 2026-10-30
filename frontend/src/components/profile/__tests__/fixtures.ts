import { http } from 'msw';

import { profileSchema, type Profile } from '@/schemas/profile.schema';
import { makeUser, ok } from '@/test/msw/handlers';

import type { UserRole } from '@/types';

const DAY_MS = 86_400_000;
const PLAN_DAYS = 30;

/** A running plan that ends 30 days from now. */
export const runningPlan = (plan = 'Premium') => ({
  plan,
  startDate: new Date(Date.now() - DAY_MS).toISOString(),
  endDate: new Date(Date.now() + PLAN_DAYS * DAY_MS).toISOString(),
});

/** GET /api/auth/me with the profile fields, checked against the app's schema. */
export const makeProfile = (role: UserRole, overrides: Partial<Profile> = {}): Profile =>
  profileSchema.parse({
    ...makeUser(role),
    isCommunityProfilePrivate: false,
    purchasedCourses: [],
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  });

/** The "me" endpoint answering with this profile. */
export const profileReturns = (profile: Profile) => http.get('*/api/auth/me', () => ok(profile));

/** GET /api/subscription-plans with one plan configuration. */
export const planConfigsReturn = (plan: string, courseCount: number, features: string[]) =>
  http.get('*/api/subscription-plans', () =>
    ok(
      [{ _id: '64b7f0c2a1b2c3d4e5f68001', plan, price: 500, duration: 1, courseCount, features }],
      {
        total: 1,
      },
    ),
  );

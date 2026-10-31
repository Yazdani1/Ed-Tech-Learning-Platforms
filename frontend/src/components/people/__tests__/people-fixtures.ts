import { http } from 'msw';

import { subscriptionPlanSchema, type SubscriptionPlan } from '@/schemas/catalog.schema';
import {
  managedUserSchema,
  subscriptionRecordSchema,
  type ManagedUser,
  type SubscriptionRecord,
} from '@/schemas/people.schema';
import { adminTeacherSchema, type AdminTeacher } from '@/schemas/public.schema';
import { ok } from '@/test/msw/handlers';

import type { UserRole } from '@/types';

// Response fixtures for the people admin tests, checked against the same schemas the app uses.

export const objectId = (suffix: string): string =>
  `64b7f0c2a1b2c3d4e5f6${suffix.padStart(4, '0')}`;

export const makeManagedUser = (
  suffix: string,
  name: string,
  role: UserRole = 'Student',
  extra: Record<string, unknown> = {},
): ManagedUser =>
  managedUserSchema.parse({
    _id: objectId(suffix),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role,
    createdAt: '2026-10-01T10:00:00.000Z',
    ...extra,
  });

export const usersEnvelope = (users: ManagedUser[], totalUsers = users.length) => ({
  total: users.length,
  totalUsers,
  pagination: {
    page: 1,
    limit: 10,
    total: users.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
});

/** GET /api/users answering with these users (the envelope's extra fields included). */
export const usersHandler = (users: ManagedUser[], totalUsers = users.length) =>
  http.get('*/api/users', () => ok(users, usersEnvelope(users, totalUsers)));

export const makeTeacher = (
  suffix: string,
  name: string,
  extra: Record<string, unknown> = {},
): AdminTeacher =>
  adminTeacherSchema.parse({
    _id: objectId(suffix),
    name,
    bio: `${name} teaches well.`,
    expertise: ['Maths', 'Physics'],
    createdAt: '2026-09-01T10:00:00.000Z',
    ...extra,
  });

export const makePlan = (suffix: string, plan: string, price = 500): SubscriptionPlan =>
  subscriptionPlanSchema.parse({
    _id: objectId(suffix),
    plan,
    price,
    duration: 1,
    billingOptions: [
      { label: 'Monthly', duration: 1, price },
      { label: 'Yearly', duration: 12, price: price * 10 },
    ],
    features: ['All courses'],
    courseCount: 3,
  });

export const makeSubscription = (
  suffix: string,
  status: SubscriptionRecord['status'] = 'Active',
): SubscriptionRecord =>
  subscriptionRecordSchema.parse({
    _id: objectId(suffix),
    user: { _id: objectId('9001'), name: 'Asha Rahman', email: 'asha@example.com' },
    plan: 'Premium',
    billingDuration: 1,
    billingLabel: 'Monthly',
    pricePaid: 500,
    status,
    startDate: '2026-10-01T00:00:00.000Z',
    endDate: '2099-11-01T00:00:00.000Z',
    assignedBy: { _id: objectId('9002'), name: 'Test Admin' },
  });

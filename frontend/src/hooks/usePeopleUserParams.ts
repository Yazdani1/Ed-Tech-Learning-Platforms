'use client';

import { z } from 'zod';

import { useUrlListParams, type UrlListParams } from './useUrlListParams';

/** Users per page on /admin/users (same as the old page). */
export const USERS_PAGE_SIZE = 10;

const text = z.string().catch('');

/** The user list filters kept in the address bar (the last eight are Super Admin only). */
export const userListUrlSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: text,
  role: text,
  subscriptionPlan: text,
  subscriptionStatus: text,
  enrollmentFilter: text,
  spendingFilter: text,
  minTotalSpent: text,
  maxTotalSpent: text,
  minPaidCourseSpend: text,
  maxPaidCourseSpend: text,
  minSubscriptionSpend: text,
  maxSubscriptionSpend: text,
});
export type UserListParams = z.infer<typeof userListUrlSchema>;
export type UserFilterKey = Exclude<keyof UserListParams, 'page'>;

/** Filters every manager can use; the rest are sent (and counted) only for a Super Admin. */
export const BASIC_USER_FILTERS: readonly UserFilterKey[] = ['search', 'role'];

export const ADVANCED_USER_FILTERS: readonly UserFilterKey[] = [
  'subscriptionPlan',
  'subscriptionStatus',
  'enrollmentFilter',
  'spendingFilter',
  'minTotalSpent',
  'maxTotalSpent',
  'minPaidCourseSpend',
  'maxPaidCourseSpend',
  'minSubscriptionSpend',
  'maxSubscriptionSpend',
];

export const usePeopleUserParams = (): UrlListParams<UserListParams> =>
  useUrlListParams(userListUrlSchema);

/** What GET /api/users receives for this viewer. */
export const toUserQuery = (
  params: UserListParams,
  isSuperAdmin: boolean,
): Record<string, string | number> => {
  const keys = isSuperAdmin
    ? [...BASIC_USER_FILTERS, ...ADVANCED_USER_FILTERS]
    : BASIC_USER_FILTERS;
  const query: Record<string, string | number> = { page: params.page, limit: USERS_PAGE_SIZE };
  keys.forEach((key) => {
    const value = params[key].trim();
    if (value) query[key] = value;
  });
  return query;
};

/** How many filters are set (Admins: only search and role count). */
export const countUserFilters = (params: UserListParams, isSuperAdmin: boolean): number =>
  (isSuperAdmin ? [...BASIC_USER_FILTERS, ...ADVANCED_USER_FILTERS] : BASIC_USER_FILTERS).filter(
    (key) => params[key].trim() !== '',
  ).length;

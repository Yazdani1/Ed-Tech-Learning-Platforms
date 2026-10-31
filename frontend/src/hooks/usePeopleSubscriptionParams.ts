'use client';

import { z } from 'zod';

import { memberStatusSchema } from '@/schemas/people.schema';

import { useUrlListParams, type UrlListParams } from './useUrlListParams';

/** Member records per page (same as the old page). */
export const MEMBERS_PAGE_SIZE = 10;

/** /admin/subscriptions state in the address bar: the tab and the member list filters. */
export const subscriptionUrlSchema = z.object({
  tab: z.enum(['plans', 'members']).catch('plans'),
  page: z.coerce.number().int().min(1).catch(1),
  status: memberStatusSchema.catch('active'),
  search: z.string().catch(''),
  plan: z.string().catch(''),
  billingDuration: z.string().catch(''),
});
export type SubscriptionUrlParams = z.infer<typeof subscriptionUrlSchema>;

export const usePeopleSubscriptionParams = (): UrlListParams<SubscriptionUrlParams> =>
  useUrlListParams(subscriptionUrlSchema);

/** What GET /api/subscriptions receives. */
export const toSubscriptionQuery = (
  params: SubscriptionUrlParams,
): Record<string, string | number> => ({
  page: params.page,
  limit: MEMBERS_PAGE_SIZE,
  status: params.status,
  search: params.search.trim(),
  plan: params.plan,
  billingDuration: params.billingDuration,
});

/** Filters that differ from the default view (status other than "active" counts as one). */
export const countMemberFilters = (params: SubscriptionUrlParams): number =>
  [params.search.trim(), params.plan, params.billingDuration].filter(Boolean).length +
  (params.status === 'active' ? 0 : 1);

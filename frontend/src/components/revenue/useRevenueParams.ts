'use client';

import { z } from 'zod';

import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';
import { ORDER_TYPES } from '@/schemas/revenue.schema';

import type { OrderFilters } from '@/api/revenue.api';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Page, order type and the chosen courses, kept in the URL (bad values fall back to the defaults). */
const revenueParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  type: z.enum(ORDER_TYPES).catch('all'),
  courses: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .filter((id) => OBJECT_ID.test(id))
        .join(','),
    )
    .catch(''),
});
export type RevenueParams = z.infer<typeof revenueParamsSchema>;

interface RevenueUrlState extends UrlListParams<RevenueParams> {
  courseIds: string[];
  filters: OrderFilters;
}

export const useRevenueParams = (): RevenueUrlState => {
  const url = useUrlListParams(revenueParamsSchema);
  const courseIds = url.params.courses.split(',').filter(Boolean);
  return { ...url, courseIds, filters: { type: url.params.type, courseIds } };
};

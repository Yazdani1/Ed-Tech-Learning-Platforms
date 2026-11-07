'use client';

import { z } from 'zod';

import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';
import { ORDER_TYPES } from '@/schemas/revenue.schema';

import { dayRange, isDayKey, isMonthKey, monthRange, type DateRange } from './revenue-period';

import type { OrderFilters } from '@/api/revenue.api';

const OBJECT_ID = /^[a-f\d]{24}$/i;
export const REVENUE_VIEWS = ['monthly', 'all'] as const;
export type RevenueView = (typeof REVENUE_VIEWS)[number];

/**
 * The Revenue page state, kept in the URL (bad values fall back to the defaults):
 * view (Monthly sales / All sales), the opened month, page, order type, courses, and the All sales period
 * (`period` = '' all time | 'yyyy-MM' a month | 'custom' with `from` / `to` days).
 */
const revenueParamsSchema = z.object({
  view: z.enum(REVENUE_VIEWS).catch('monthly'),
  month: z.string().refine(isMonthKey).catch(''),
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
  period: z
    .string()
    .refine((value) => value === 'custom' || isMonthKey(value))
    .catch(''),
  from: z.string().refine(isDayKey).catch(''),
  to: z.string().refine(isDayKey).catch(''),
});
export type RevenueParams = z.infer<typeof revenueParamsSchema>;

interface RevenueUrlState extends UrlListParams<RevenueParams> {
  courseIds: string[];
  /** The filters of the sales table shown now (month details or All sales) */
  filters: OrderFilters;
}

const rangeOf = (params: RevenueParams): DateRange => {
  if (params.view === 'monthly') return params.month ? monthRange(params.month) : {};
  if (params.period === 'custom') return dayRange(params.from, params.to);
  return params.period ? monthRange(params.period) : {};
};

export const useRevenueParams = (): RevenueUrlState => {
  const url = useUrlListParams(revenueParamsSchema);
  const courseIds = url.params.courses.split(',').filter(Boolean);
  return {
    ...url,
    courseIds,
    filters: { type: url.params.type, courseIds, ...rangeOf(url.params) },
  };
};

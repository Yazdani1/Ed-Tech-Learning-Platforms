'use client';

import { z } from 'zod';

import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';
import { dateRangeSchema } from '@/schemas/insights.schema';
import { isDateInput } from '@/utils/dateTime';

import type { PerformanceFilters } from '@/api/insights.api';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export const CHART_METRICS = ['revenue', 'enrollments', 'paidEnrollments'] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

export const CHART_TYPES = ['line', 'bar', 'pie'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

const dayInput = z
  .string()
  .refine((value) => isDateInput(value))
  .catch('');

/** The report's choices, kept in the URL (bad values fall back to the defaults, never reach the API). */
const performanceParamsSchema = z.object({
  /** Selected course ids, comma separated; malformed ids are dropped; empty = all courses */
  courses: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .filter((id) => OBJECT_ID.test(id))
        .join(','),
    )
    .catch(''),
  range: dateRangeSchema.catch('30d'),
  from: dayInput,
  to: dayInput,
  metric: z.enum(CHART_METRICS).catch('revenue'),
  chart: z.enum(CHART_TYPES).catch('line'),
});
export type PerformanceParams = z.infer<typeof performanceParamsSchema>;

interface PerformanceUrlState extends UrlListParams<PerformanceParams> {
  courseIds: string[];
  filters: PerformanceFilters;
  /** False for a custom range without a valid start and end (nothing is requested then) */
  isReady: boolean;
}

export const usePerformanceParams = (): PerformanceUrlState => {
  const url = useUrlListParams(performanceParamsSchema);
  const { courses, range, from, to } = url.params;
  const courseIds = courses.split(',').filter(Boolean);
  const isReady = range !== 'custom' || (from !== '' && to !== '' && from <= to);
  return { ...url, courseIds, isReady, filters: { courseIds, dateRange: range, from, to } };
};

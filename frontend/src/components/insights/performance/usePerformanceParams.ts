'use client';

import { z } from 'zod';

import { ALL_COURSES } from '@/api/insights.api';
import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';
import { dateRangeSchema } from '@/schemas/insights.schema';

const OBJECT_ID = /^[a-f\d]{24}$/i;

export const CHART_METRICS = ['revenue', 'enrollments'] as const;
export type ChartMetric = (typeof CHART_METRICS)[number];

export const CHART_TYPES = ['line', 'bar', 'pie'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

/** The report's choices, kept in the URL (bad values fall back to the defaults, never reach the API). */
const performanceParamsSchema = z.object({
  course: z
    .string()
    .refine((value) => value === ALL_COURSES || OBJECT_ID.test(value))
    .catch(ALL_COURSES),
  range: dateRangeSchema.catch('30d'),
  metric: z.enum(CHART_METRICS).catch('revenue'),
  chart: z.enum(CHART_TYPES).catch('line'),
});
export type PerformanceParams = z.infer<typeof performanceParamsSchema>;

export const usePerformanceParams = (): UrlListParams<PerformanceParams> =>
  useUrlListParams(performanceParamsSchema);

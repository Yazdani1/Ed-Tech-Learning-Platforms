'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  dashboardSummarySchema,
  performanceCourseSchema,
  performanceOverviewSchema,
  type DashboardSummary,
  type DateRange,
  type PerformanceCourse,
  type PerformanceOverview,
} from '@/schemas/insights.schema';
import { http, type ApiError } from '@/services/http.service';
import { viewerTimeZone } from '@/utils/dateTime';

import { queryKeys } from './query-keys';

// Super Admin insights: the dashboard summary and the performance reports. Both send the viewer's time
// zone, so "today", "last 7 days" and "this month" are the viewer's own.

export interface PerformanceFilters {
  /** Selected course ids; empty = every course */
  courseIds: readonly string[];
  dateRange: DateRange;
  /** "yyyy-MM-dd", custom range only */
  from: string;
  to: string;
}

/** The query string of GET /api/performance/overview (from/to only for a custom range). */
const performanceQuery = (filters: PerformanceFilters): Record<string, string> => ({
  courseIds: filters.courseIds.length > 0 ? filters.courseIds.join(',') : 'all',
  dateRange: filters.dateRange,
  tz: viewerTimeZone(),
  ...(filters.dateRange === 'custom' ? { from: filters.from, to: filters.to } : {}),
});

export const getDashboardSummary = (): Promise<DashboardSummary> =>
  http.get('/api/dashboard/summary', dashboardSummarySchema, {
    params: { tz: viewerTimeZone() },
  });

export const getPerformanceOverview = (filters: PerformanceFilters): Promise<PerformanceOverview> =>
  http.get('/api/performance/overview', performanceOverviewSchema, {
    params: performanceQuery(filters),
  });

export const getPerformanceCourses = (): Promise<PerformanceCourse[]> =>
  http.get('/api/performance/courses', z.array(performanceCourseSchema));

export const useDashboardSummary = (): UseQueryResult<DashboardSummary, ApiError> =>
  useQuery({
    queryKey: queryKeys.insights.dashboard(viewerTimeZone()),
    queryFn: getDashboardSummary,
  });

/** Keeps the previous numbers on screen while other courses or another range load. */
export const usePerformanceOverview = (
  filters: PerformanceFilters,
  enabled = true,
): UseQueryResult<PerformanceOverview, ApiError> =>
  useQuery({
    queryKey: queryKeys.insights.performance(performanceQuery(filters)),
    queryFn: () => getPerformanceOverview(filters),
    placeholderData: keepPreviousData,
    enabled,
  });

export const usePerformanceCourses = (): UseQueryResult<PerformanceCourse[], ApiError> =>
  useQuery({ queryKey: queryKeys.insights.performanceCourses, queryFn: getPerformanceCourses });

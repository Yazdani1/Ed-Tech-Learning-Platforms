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

import { queryKeys } from './query-keys';

// Super Admin insights: the dashboard summary and the performance reports.

/** "All courses" in GET /api/performance/overview. */
export const ALL_COURSES = 'all';

export const getDashboardSummary = (): Promise<DashboardSummary> =>
  http.get('/api/dashboard/summary', dashboardSummarySchema);

export const getPerformanceOverview = (
  courseId: string,
  dateRange: DateRange,
): Promise<PerformanceOverview> => {
  const query = new URLSearchParams({ courseId, dateRange });
  return http.get(`/api/performance/overview?${query.toString()}`, performanceOverviewSchema);
};

export const getPerformanceCourses = (): Promise<PerformanceCourse[]> =>
  http.get('/api/performance/courses', z.array(performanceCourseSchema));

export const useDashboardSummary = (): UseQueryResult<DashboardSummary, ApiError> =>
  useQuery({ queryKey: queryKeys.insights.dashboard, queryFn: getDashboardSummary });

/** Keeps the previous numbers on screen while another course or range loads. */
export const usePerformanceOverview = (
  courseId: string,
  dateRange: DateRange,
): UseQueryResult<PerformanceOverview, ApiError> =>
  useQuery({
    queryKey: queryKeys.insights.performance(courseId, dateRange),
    queryFn: () => getPerformanceOverview(courseId, dateRange),
    placeholderData: keepPreviousData,
  });

export const usePerformanceCourses = (): UseQueryResult<PerformanceCourse[], ApiError> =>
  useQuery({ queryKey: queryKeys.insights.performanceCourses, queryFn: getPerformanceCourses });

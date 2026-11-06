'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  orderSchema,
  revenueSummarySchema,
  type Order,
  type OrderType,
  type RevenueSummary,
} from '@/schemas/revenue.schema';
import { http, type ApiError } from '@/services/http.service';
import { viewerTimeZone } from '@/utils/dateTime';

import { queryKeys } from './query-keys';

import type { ListResult } from '@/types';

// Revenue page (Super Admin, Admin): sales summary + charts, every order, and the course enrolments page's orders.

export interface OrderFilters {
  type: OrderType;
  /** Empty = every course */
  courseIds: readonly string[];
}

const filterParams = ({ type, courseIds }: OrderFilters): Record<string, string> => ({
  type,
  ...(courseIds.length > 0 && { courseIds: courseIds.join(',') }),
});

// ---- Requests ----

export const getRevenueSummary = (filters: OrderFilters): Promise<RevenueSummary> =>
  http.get('/api/revenue/summary', revenueSummarySchema, {
    params: { ...filterParams(filters), tz: viewerTimeZone() },
  });

export const getRevenueOrders = (
  filters: OrderFilters,
  page: number,
  limit: number,
): Promise<ListResult<Order>> =>
  http.list('/api/revenue/orders', orderSchema, {
    params: { ...filterParams(filters), page, limit },
  });

/** Every matching order (up to 5000) for the CSV / PDF of a whole course or filter. */
export const exportRevenueOrders = (filters: OrderFilters): Promise<Order[]> =>
  http.get('/api/revenue/orders/export', z.array(orderSchema), { params: filterParams(filters) });

/** Every enrolment of one course with its price snapshot (course enrolments page). */
export const getCourseOrders = (courseId: string): Promise<Order[]> =>
  http.get(`/api/enrollments/admin/course/${encodeURIComponent(courseId)}`, z.array(orderSchema));

// ---- Hooks ----

export const useRevenueSummary = (
  filters: OrderFilters,
): UseQueryResult<RevenueSummary, ApiError> =>
  useQuery({
    queryKey: queryKeys.revenue.summary(filterParams(filters)),
    queryFn: () => getRevenueSummary(filters),
    placeholderData: keepPreviousData,
  });

export const useRevenueOrders = (
  filters: OrderFilters,
  page: number,
  limit: number,
): UseQueryResult<ListResult<Order>, ApiError> =>
  useQuery({
    queryKey: queryKeys.revenue.orders({ ...filterParams(filters), page, limit }),
    queryFn: () => getRevenueOrders(filters, page, limit),
    placeholderData: keepPreviousData,
  });

/** `enabled` false for Moderators (the endpoint is Super Admin + Admin only). */
export const useCourseOrders = (
  courseId: string,
  enabled: boolean,
): UseQueryResult<Order[], ApiError> =>
  useQuery({
    queryKey: queryKeys.adminCourses.enrollments(courseId, 'all'),
    queryFn: () => getCourseOrders(courseId),
    enabled,
  });

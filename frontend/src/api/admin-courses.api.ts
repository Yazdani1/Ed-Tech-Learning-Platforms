'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  adminCourseSchema,
  adminEnrollmentSchema,
  enrollmentStatsSchema,
  type AdminCourse,
  type AdminEnrollment,
  type BulkDiscountRequest,
  type BulkUpdateRequest,
  type CourseStatus,
  type EnrollmentStats,
} from '@/schemas/admin-courses.schema';
import { http, type ApiError } from '@/services/http.service';

import { refreshCourseLists } from './course-cache';
import { queryKeys } from './query-keys';

// Staff course list (GET /api/courses with filters), publish/unpublish, delete, bulk edit, bulk discount and
// the enrolments of one course (enrolled students: enrollment.api.ts). Categories, course types and plans: catalog.api.ts; teachers: public.api.ts.

/** GET /api/courses filters as the backend takes them (empty values are left out). */
export type AdminCourseQuery = Record<string, string>;

const courseUrl = (id: string): string => `/api/courses/${encodeURIComponent(id)}`;
const adminEnrollmentsUrl = (courseId: string): string =>
  `/api/enrollments/admin/course/${encodeURIComponent(courseId)}`;

// ---- Requests ----

export const getAdminCourses = async (params: AdminCourseQuery): Promise<AdminCourse[]> =>
  (await http.list('/api/courses', adminCourseSchema, { params })).items;

export const setCourseStatus = async (id: string, status: CourseStatus): Promise<void> => {
  await http.send('PATCH', `${courseUrl(id)}/status`, { status });
};

/** The backend refuses (400, with a message) to delete a course that has enrolments. */
export const deleteCourse = async (id: string): Promise<void> => {
  await http.send('DELETE', courseUrl(id));
};

export const bulkUpdateCourses = async (body: BulkUpdateRequest): Promise<void> => {
  await http.send('PATCH', '/api/courses/bulk', body);
};

export const bulkDiscountCourses = async (body: BulkDiscountRequest): Promise<void> => {
  await http.send('PATCH', '/api/courses/bulk/discount', body);
};

export const getEnrollmentStats = (courseId: string): Promise<EnrollmentStats> =>
  http.get(`${adminEnrollmentsUrl(courseId)}/stats`, enrollmentStatsSchema);

export const getPaidEnrollments = (courseId: string): Promise<AdminEnrollment[]> =>
  http.get(adminEnrollmentsUrl(courseId), z.array(adminEnrollmentSchema), {
    params: { type: 'paid' },
  });

// ---- Hooks ----

export const useAdminCourses = (
  params: AdminCourseQuery,
): UseQueryResult<AdminCourse[], ApiError> =>
  useQuery({
    queryKey: queryKeys.adminCourses.list(params),
    queryFn: () => getAdminCourses(params),
    placeholderData: keepPreviousData,
  });

export interface SetStatusInput {
  id: string;
  status: CourseStatus;
}

export const useSetCourseStatus = (): UseMutationResult<void, ApiError, SetStatusInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => setCourseStatus(id, status),
    onSuccess: () => refreshCourseLists(queryClient),
  });
};

export const useDeleteCourse = (): UseMutationResult<void, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => refreshCourseLists(queryClient),
  });
};

export const useBulkUpdateCourses = (): UseMutationResult<void, ApiError, BulkUpdateRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateCourses,
    onSuccess: () => refreshCourseLists(queryClient),
  });
};

export const useBulkDiscount = (): UseMutationResult<void, ApiError, BulkDiscountRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDiscountCourses,
    onSuccess: () => refreshCourseLists(queryClient),
  });
};

/** `enabled` false for Moderators (the stats endpoint is Super Admin + Admin only). */
export const useEnrollmentStats = (
  courseId: string,
  enabled: boolean,
): UseQueryResult<EnrollmentStats, ApiError> =>
  useQuery({
    queryKey: queryKeys.adminCourses.enrollmentStats(courseId),
    queryFn: () => getEnrollmentStats(courseId),
    enabled,
  });

export const usePaidEnrollments = (
  courseId: string,
  enabled: boolean,
): UseQueryResult<AdminEnrollment[], ApiError> =>
  useQuery({
    queryKey: queryKeys.adminCourses.enrollments(courseId, 'paid'),
    queryFn: () => getPaidEnrollments(courseId),
    enabled,
  });

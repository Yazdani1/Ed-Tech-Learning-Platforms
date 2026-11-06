'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  browseEnvelopeSchema,
  courseSchema,
  enrollmentCheckSchema,
  liveClassWeekSchema,
  type BrowseResult,
  type Course,
  type EnrollmentCheck,
  type LiveClassWeek,
} from '@/schemas/browse.schema';
import { http, isApiError, type ApiError } from '@/services/http.service';

import type { PublicQuizSection } from '@/schemas/practice-quiz.schema';

import { getPublicQuizTree } from './quiz.api';
import { queryKeys } from './query-keys';

// Categories, course types, plans, the student's enrolments and subscription, enrol/unenrol: catalog.api.ts.

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
/** A MongoDB ObjectId: anything else can never be a course, so it is not even requested. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Filters and paging of the catalog, as GET /api/courses/browse takes them (comma-separated lists). */
export type BrowseQuery = Record<string, string | number>;

export const isCourseId = (id: string): boolean => OBJECT_ID.test(id);

// ---- Requests ----

export const browseCourses = (params: BrowseQuery): Promise<BrowseResult> =>
  http.getEnvelope('/api/courses/browse', browseEnvelopeSchema, { params });

export const getCourse = (id: string): Promise<Course> =>
  http.get(`/api/courses/${encodeURIComponent(id)}`, courseSchema);

export const getLiveClasses = (courseId: string): Promise<LiveClassWeek[]> =>
  http.get(
    `/api/study-curricula/course/${encodeURIComponent(courseId)}`,
    z.array(liveClassWeekSchema),
  );

export const checkEnrollment = (courseId: string): Promise<EnrollmentCheck> =>
  http.get(`/api/enrollments/${encodeURIComponent(courseId)}/check`, enrollmentCheckSchema);

/**
 * True for "this course does not exist or is not visible to you" (the page shows "Course not found"):
 * 404, and 400 which the backend answers for a malformed id.
 */
/**
 * Counts a visit of a public course page (once per visitor per day on the server; anonymous visitors get a
 * cookie). Fire-and-forget: a failure never bothers the visitor.
 */
export const recordCourseView = async (courseId: string): Promise<void> => {
  await http.send('POST', `/api/courses/${encodeURIComponent(courseId)}/view`);
};

export const isNotFoundError = (error: unknown): boolean =>
  isApiError(error, HTTP_NOT_FOUND) || isApiError(error, HTTP_BAD_REQUEST);

// ---- Hooks ----

/** `enabled` false: nothing is requested (the catalog shows its sections instead of results). */
export const useBrowseCourses = (
  params: BrowseQuery,
  enabled = true,
): UseQueryResult<BrowseResult, ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.courses(params),
    queryFn: () => browseCourses(params),
    enabled,
    // Keep the old cards on screen while a new filter loads (no flashing grid)
    placeholderData: keepPreviousData,
  });

/** Every public free course (the server filters by pricing; no paging, the page groups them by type). */
export const useFreeCourses = (): UseQueryResult<Course[], ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.freeCourses,
    queryFn: async () => (await browseCourses({ pricing: 'Free' })).data,
  });

/** One course; a malformed id is not requested (the page shows "Course not found" at once). */
export const useCourse = (id: string): UseQueryResult<Course, ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.course(id),
    queryFn: () => getCourse(id),
    enabled: isCourseId(id),
  });

export const useLiveClasses = (courseId: string): UseQueryResult<LiveClassWeek[], ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.liveClasses(courseId),
    queryFn: () => getLiveClasses(courseId),
  });

export const usePublicQuizSections = (
  courseId: string,
): UseQueryResult<PublicQuizSection[], ApiError> =>
  useQuery({
    queryKey: queryKeys.quiz.publicTree(courseId),
    queryFn: () => getPublicQuizTree(courseId),
    select: (tree) => tree.sections,
  });

export const useEnrollmentCheck = (
  courseId: string,
  enabled: boolean,
): UseQueryResult<EnrollmentCheck, ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.enrollment(courseId),
    queryFn: () => checkEnrollment(courseId),
    enabled,
  });

/** Counts one visit of a public course page (fire-and-forget: a failure never bothers the visitor). */
export const useRecordCourseView = (): UseMutationResult<void, ApiError, string> =>
  useMutation({ mutationFn: recordCourseView });

'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  browseEnvelopeSchema,
  courseSchema,
  enrollmentCheckSchema,
  liveClassWeekSchema,
  publicQuizTreeSchema,
  type BrowseResult,
  type Course,
  type EnrollmentCheck,
  type LiveClassWeek,
  type PublicQuizSection,
} from '@/schemas/browse.schema';
import { http, isApiError, type ApiError } from '@/services/http.service';

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

export const getPublicQuizSections = async (courseId: string): Promise<PublicQuizSection[]> =>
  (
    await http.get(
      `/api/quiz-bank/public/course/${encodeURIComponent(courseId)}`,
      publicQuizTreeSchema,
    )
  ).sections;

export const checkEnrollment = (courseId: string): Promise<EnrollmentCheck> =>
  http.get(`/api/enrollments/${encodeURIComponent(courseId)}/check`, enrollmentCheckSchema);

/**
 * True for "this course does not exist or is not visible to you" (the page shows "Course not found"):
 * 404, and 400 which the backend answers for a malformed id.
 */
export const isNotFoundError = (error: unknown): boolean =>
  isApiError(error, HTTP_NOT_FOUND) || isApiError(error, HTTP_BAD_REQUEST);

// ---- Hooks ----

export const useBrowseCourses = (params: BrowseQuery): UseQueryResult<BrowseResult, ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.courses(params),
    queryFn: () => browseCourses(params),
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
    queryKey: queryKeys.browse.quizTree(courseId),
    queryFn: () => getPublicQuizSections(courseId),
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

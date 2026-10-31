'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { getCourse, isCourseId } from '@/api/browse.api';
import {
  announcementSchema,
  enrollmentCountSchema,
  studyMaterialSchema,
  type Announcement,
  type StudyMaterial,
  type StudyMaterialRequest,
  type TitledPostRequest,
} from '@/schemas/learn.schema';
import { http, isApiError, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { Course } from '@/schemas/browse.schema';

// Course player: the course, its content lists (announcements, study materials) with their create/edit/delete
// mutations (live classes: live-class.api.ts), and the enrolment count. Students: enrollment.api.ts. Q&A: learn-qa.api.ts; quizzes:
// learn-quiz.api.ts.

const HTTP_FORBIDDEN = 403;

export { isNotFoundError } from '@/api/browse.api';

/** "You do not have access to this course" (not enrolled, plan expired, teacher of another course). */
export const isForbiddenError = (error: unknown): boolean => isApiError(error, HTTP_FORBIDDEN);

const enc = encodeURIComponent;

/** The content lists share one URL pattern: GET/POST /api/<base>/course/:courseId, PUT/DELETE /:id. */
type ContentKind = 'announcements' | 'materials';

const CONTENT_BASE: Record<ContentKind, string> = {
  announcements: '/api/announcements',
  materials: '/api/study-materials',
};

interface ContentTypes {
  announcements: { item: Announcement; body: TitledPostRequest };
  materials: { item: StudyMaterial; body: StudyMaterialRequest };
}

const CONTENT_SCHEMA: { [K in ContentKind]: z.ZodType<ContentTypes[K]['item']> } = {
  announcements: announcementSchema,
  materials: studyMaterialSchema,
};

export interface SaveContentVariables<B> {
  /** Set to edit, undefined to create */
  id?: string;
  body: B;
}

// ---- Requests ----

export const getContentList = <K extends ContentKind>(
  kind: K,
  courseId: string,
): Promise<ContentTypes[K]['item'][]> =>
  http.get(`${CONTENT_BASE[kind]}/course/${enc(courseId)}`, z.array(CONTENT_SCHEMA[kind]));

export const saveContent = <K extends ContentKind>(
  kind: K,
  courseId: string,
  { id, body }: SaveContentVariables<ContentTypes[K]['body']>,
): Promise<ContentTypes[K]['item']> => {
  const schema = CONTENT_SCHEMA[kind];
  return id
    ? http.put(`${CONTENT_BASE[kind]}/${enc(id)}`, body, schema)
    : http.post(`${CONTENT_BASE[kind]}/course/${enc(courseId)}`, body, schema);
};

export const deleteContent = async (kind: ContentKind, id: string): Promise<void> => {
  await http.send('DELETE', `${CONTENT_BASE[kind]}/${enc(id)}`);
};

export const getEnrollmentCount = async (courseId: string): Promise<number> =>
  (await http.get(`/api/enrollments/course/${enc(courseId)}/count`, enrollmentCountSchema)).count;

// ---- Hooks ----

/**
 * The course with its outline. Same request and cache entry as the course page, but always refreshed on
 * open: video addresses depend on access, which may have changed since the course page was cached.
 */
export const useLearnCourse = (courseId: string): UseQueryResult<Course, ApiError> =>
  useQuery({
    queryKey: queryKeys.browse.course(courseId),
    queryFn: () => getCourse(courseId),
    enabled: isCourseId(courseId),
    refetchOnMount: 'always',
  });

const CONTENT_KEY: Record<ContentKind, (courseId: string) => readonly string[]> = {
  announcements: queryKeys.learn.announcements,
  materials: queryKeys.learn.materials,
};

/** One content list. Announcements double as the access check of the whole player (403 = no access). */
export const useContentList = <K extends ContentKind>(
  kind: K,
  courseId: string,
  enabled = true,
): UseQueryResult<ContentTypes[K]['item'][], ApiError> =>
  useQuery({
    queryKey: CONTENT_KEY[kind](courseId),
    queryFn: () => getContentList(kind, courseId),
    enabled: enabled && isCourseId(courseId),
  });

const useInvalidateContent = (kind: ContentKind, courseId: string): (() => Promise<void>) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CONTENT_KEY[kind](courseId) });
};

export const useSaveContent = <K extends ContentKind>(
  kind: K,
  courseId: string,
): UseMutationResult<
  ContentTypes[K]['item'],
  ApiError,
  SaveContentVariables<ContentTypes[K]['body']>
> => {
  const invalidate = useInvalidateContent(kind, courseId);
  return useMutation({
    mutationFn: (variables) => saveContent(kind, courseId, variables),
    onSuccess: invalidate,
  });
};

export const useDeleteContent = (
  kind: ContentKind,
  courseId: string,
): UseMutationResult<void, ApiError, string> => {
  const invalidate = useInvalidateContent(kind, courseId);
  return useMutation({
    mutationFn: (id) => deleteContent(kind, id),
    onSuccess: invalidate,
  });
};

export const useEnrollmentCount = (courseId: string): UseQueryResult<number, ApiError> =>
  useQuery({
    queryKey: queryKeys.learn.enrollmentCount(courseId),
    queryFn: () => getEnrollmentCount(courseId),
    enabled: isCourseId(courseId),
  });

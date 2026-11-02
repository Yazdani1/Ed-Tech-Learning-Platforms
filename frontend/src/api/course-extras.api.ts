'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import {
  courseExtrasSchema,
  courseImageSchema,
  type CourseExtras,
  type CourseExtrasPatch,
  type CourseImage,
} from '@/schemas/course-extras.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { Course } from '@/schemas/browse.schema';

// The course page sections (tools, what you get, projects, audience, success stories, FAQ): saved per
// section from the course editor; the course itself is read with browse.api useCourse.

const UPLOAD_TIMEOUT_MS = 60_000;
const courseUrl = (courseId: string): string => `/api/courses/${encodeURIComponent(courseId)}`;

// ---- Requests ----

/** Uploads one picture for a section; the result goes into the section and is saved with it. */
export const uploadCourseImage = (courseId: string, file: File): Promise<CourseImage> => {
  const data = new FormData();
  data.append('image', file);
  return http.post(`${courseUrl(courseId)}/images`, data, courseImageSchema, {
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
};

/** Replaces the sections sent; pictures no longer used are deleted on the server. */
export const updateCourseExtras = (
  courseId: string,
  patch: CourseExtrasPatch,
): Promise<CourseExtras> => http.patch(`${courseUrl(courseId)}/extras`, patch, courseExtrasSchema);

// ---- Hooks ----

export const useUploadCourseImage = (
  courseId: string,
): UseMutationResult<CourseImage, ApiError, File> =>
  useMutation({ mutationFn: (file) => uploadCourseImage(courseId, file) });

/** Saves sections; the cached course (editor and course page) gets the saved values at once. */
export const useUpdateCourseExtras = (
  courseId: string,
): UseMutationResult<CourseExtras, ApiError, CourseExtrasPatch> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch) => updateCourseExtras(courseId, patch),
    onSuccess: (extras) => {
      queryClient.setQueryData<Course>(queryKeys.browse.course(courseId), (current) =>
        current ? { ...current, ...extras } : current,
      );
    },
  });
};

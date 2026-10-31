'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import { courseStudentSchema, type CourseStudent } from '@/schemas/enrollment.schema';
import { http, type ApiError } from '@/services/http.service';

import { isCourseId } from './browse.api';
import { queryKeys } from './query-keys';

// The enrolled students of one course (admin enrolments page, course player Students tab, teacher dialog):
// one request and one cache entry. Enrolling and the student's own enrolments: catalog.api.ts.

const studentsUrl = (courseId: string): string =>
  `/api/enrollments/course/${encodeURIComponent(courseId)}/students`;

/** Same-origin CSV download (the browser sends the session cookie; no token in the address). */
export const studentsExportUrl = (courseId: string): string => `${studentsUrl(courseId)}/export`;

export const getCourseStudents = (courseId: string): Promise<CourseStudent[]> =>
  http.get(studentsUrl(courseId), z.array(courseStudentSchema));

/** `enabled` false while a dialog is closed or for viewers the endpoint refuses. */
export const useCourseStudents = (
  courseId: string,
  enabled = true,
): UseQueryResult<CourseStudent[], ApiError> =>
  useQuery({
    queryKey: queryKeys.enrollments.students(courseId),
    queryFn: () => getCourseStudents(courseId),
    enabled: enabled && isCourseId(courseId),
  });

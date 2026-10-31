'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { teacherCourseSchema, type TeacherCourse } from '@/schemas/teacher.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Teacher area reads: GET /api/teachers/my-courses, one request and cache entry for the teacher's course
// list and the profile's course count. Enrolled students of a course: enrollment.api.ts.

/** The courses the signed-in teacher teaches, newest first (empty when no teacher profile is linked). */
export const getMyTeacherCourses = async (): Promise<TeacherCourse[]> =>
  (await http.list('/api/teachers/my-courses', teacherCourseSchema)).items;

export const useMyTeacherCourses = (): UseQueryResult<TeacherCourse[], ApiError> =>
  useQuery({ queryKey: queryKeys.teacher.myCourses, queryFn: getMyTeacherCourses });

/** How many courses the signed-in teacher teaches (profile statistics); `enabled` only for Teachers. */
export const useMyTeacherCourseCount = (enabled: boolean): UseQueryResult<number, ApiError> =>
  useQuery({
    queryKey: queryKeys.teacher.myCourses,
    queryFn: getMyTeacherCourses,
    select: (courses) => courses.length,
    enabled,
  });

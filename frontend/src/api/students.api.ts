'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  studentCourseSchema,
  studentDetailsSchema,
  studentRowSchema,
  type StudentCourse,
  type StudentDetails,
  type StudentRow,
} from '@/schemas/students.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { ListResult } from '@/types';

// Students page (Super Admin, Admin): the student list, its course filter and one student's details.

export const STUDENTS_PAGE_SIZE = 20;

export interface StudentFilters {
  page: number;
  search: string;
  /** Enrolled in any of these courses; empty = every student */
  courseIds: readonly string[];
}

const listParams = ({ page, search, courseIds }: StudentFilters) => ({
  page,
  limit: STUDENTS_PAGE_SIZE,
  search: search.trim() || undefined,
  courseIds: courseIds.length > 0 ? courseIds.join(',') : undefined,
});

export const getStudents = (filters: StudentFilters): Promise<ListResult<StudentRow>> =>
  http.list('/api/students', studentRowSchema, { params: listParams(filters) });

export const getStudentCourses = (): Promise<StudentCourse[]> =>
  http.get('/api/students/courses', z.array(studentCourseSchema));

export const getStudentDetails = (id: string): Promise<StudentDetails> =>
  http.get(`/api/students/${encodeURIComponent(id)}`, studentDetailsSchema);

/** Keeps the previous page on screen while the next one loads. */
export const useStudents = (
  filters: StudentFilters,
): UseQueryResult<ListResult<StudentRow>, ApiError> =>
  useQuery({
    queryKey: queryKeys.students.list({
      page: filters.page,
      search: filters.search.trim(),
      courseIds: filters.courseIds.join(','),
    }),
    queryFn: () => getStudents(filters),
    placeholderData: keepPreviousData,
  });

export const useStudentCourses = (): UseQueryResult<StudentCourse[], ApiError> =>
  useQuery({ queryKey: queryKeys.students.courses, queryFn: getStudentCourses });

/** Loads only while a student is open (id given). */
export const useStudentDetails = (
  id: string | undefined,
): UseQueryResult<StudentDetails, ApiError> =>
  useQuery({
    queryKey: queryKeys.students.detail(id ?? ''),
    queryFn: () => getStudentDetails(id ?? ''),
    enabled: Boolean(id),
  });

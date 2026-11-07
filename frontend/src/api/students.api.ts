'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  studentCourseSchema,
  studentDetailsSchema,
  studentRowSchema,
  type StudentCourse,
  type StudentDetails,
  type StudentEnrolmentFilter,
  type StudentPhoneFilter,
  type StudentRow,
  type StudentSort,
  type StudentStatusFilter,
} from '@/schemas/students.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { ListResult } from '@/types';

// Students page (Super Admin, Admin): the student list, its course filter and one student's details.

export const STUDENTS_PAGE_SIZE = 10;

export interface StudentFilters {
  page: number;
  search: string;
  /** Enrolled in any of these courses; empty = every student */
  courseIds: readonly string[];
  enrollment: StudentEnrolmentFilter;
  status: StudentStatusFilter;
  hasPhone: StudentPhoneFilter;
  /** ISO date-times (from included, to excluded) */
  joinedFrom?: string;
  joinedTo?: string;
  sort: StudentSort;
}

/** The filter part of the query (the same for the list and the export). */
const filterParams = (filters: Omit<StudentFilters, 'page'>): Record<string, string> => {
  const params: Record<string, string> = { sort: filters.sort };
  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.courseIds.length > 0) params.courseIds = filters.courseIds.join(',');
  if (filters.enrollment !== 'any') params.enrollment = filters.enrollment;
  if (filters.status !== 'any') params.status = filters.status;
  if (filters.hasPhone !== 'any') params.hasPhone = filters.hasPhone;
  if (filters.joinedFrom) params.joinedFrom = filters.joinedFrom;
  if (filters.joinedTo) params.joinedTo = filters.joinedTo;
  return params;
};

const listParams = (filters: StudentFilters) => ({
  ...filterParams(filters),
  page: filters.page,
  limit: STUDENTS_PAGE_SIZE,
});

/** Every matching student (up to 5000) with contact details and spending (Super Admin). */
export const exportStudents = (filters: Omit<StudentFilters, 'page'>): Promise<StudentRow[]> =>
  http.get('/api/students/export', z.array(studentRowSchema), { params: filterParams(filters) });

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
    queryKey: queryKeys.students.list({ ...filterParams(filters), page: filters.page }),
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

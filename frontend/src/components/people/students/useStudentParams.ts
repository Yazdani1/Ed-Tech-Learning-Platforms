'use client';

import { z } from 'zod';

import { dayRange, isDayKey } from '@/components/revenue/revenue-period';
import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';
import {
  STUDENT_ENROLMENT_FILTERS,
  STUDENT_PHONE_FILTERS,
  STUDENT_SORTS,
  STUDENT_STATUS_FILTERS,
} from '@/schemas/students.schema';

import type { StudentFilters } from '@/api/students.api';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Page, search, courses, enrolment type, status, phone, join days and sort order, kept in the URL (bad values
 * fall back to the defaults).
 */
const studentParamsSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  search: z.string().catch(''),
  courses: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .filter((id) => OBJECT_ID.test(id))
        .join(','),
    )
    .catch(''),
  enrollment: z.enum(STUDENT_ENROLMENT_FILTERS).catch('any'),
  status: z.enum(STUDENT_STATUS_FILTERS).catch('any'),
  phone: z.enum(STUDENT_PHONE_FILTERS).catch('any'),
  joinedFrom: z.string().refine(isDayKey).catch(''),
  joinedTo: z.string().refine(isDayKey).catch(''),
  sort: z.enum(STUDENT_SORTS).catch('newest'),
});
export type StudentParams = z.infer<typeof studentParamsSchema>;

interface StudentUrlState extends UrlListParams<StudentParams> {
  courseIds: string[];
  filters: StudentFilters;
  /** How many filters besides search are set */
  activeFilters: number;
}

export const useStudentParams = (): StudentUrlState => {
  const url = useUrlListParams(studentParamsSchema);
  const { params } = url;
  const courseIds = params.courses.split(',').filter(Boolean);
  const joined = dayRange(params.joinedFrom, params.joinedTo);
  const activeFilters = [
    courseIds.length > 0,
    params.enrollment !== 'any',
    params.status !== 'any',
    params.phone !== 'any',
    Boolean(params.joinedFrom || params.joinedTo),
  ].filter(Boolean).length;
  return {
    ...url,
    courseIds,
    activeFilters,
    filters: {
      page: params.page,
      search: params.search,
      courseIds,
      enrollment: params.enrollment,
      status: params.status,
      hasPhone: params.phone,
      joinedFrom: joined.from,
      joinedTo: joined.to,
      sort: params.sort,
    },
  };
};

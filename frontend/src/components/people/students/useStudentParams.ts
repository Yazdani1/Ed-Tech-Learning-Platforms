'use client';

import { z } from 'zod';

import { useUrlListParams, type UrlListParams } from '@/hooks/useUrlListParams';

import type { StudentFilters } from '@/api/students.api';

const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Page, search and the selected courses, kept in the URL (bad values fall back to the defaults). */
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
});
export type StudentParams = z.infer<typeof studentParamsSchema>;

interface StudentUrlState extends UrlListParams<StudentParams> {
  courseIds: string[];
  filters: StudentFilters;
}

export const useStudentParams = (): StudentUrlState => {
  const url = useUrlListParams(studentParamsSchema);
  const courseIds = url.params.courses.split(',').filter(Boolean);
  return {
    ...url,
    courseIds,
    filters: { page: url.params.page, search: url.params.search, courseIds },
  };
};

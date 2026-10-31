import { z } from 'zod';

import type { AdminCourseQuery } from '@/api/admin-courses.api';

// Filters of the staff course list, kept in the URL (?search=...&status=...). Values are what GET /api/courses
// takes; the keys of the URL are the API's parameter names, so the URL maps 1:1 to the request.

export const ACTIVITY_FILTERS = [
  'has_lifetime',
  'none_lifetime',
  'has_this_month',
  'none_this_month',
  'has_previous_month',
  'none_previous_month',
] as const;

const text = z.string().catch('');

export const courseFiltersSchema = z.object({
  search: text,
  courseType: text,
  category: text,
  teacher: text,
  status: text,
  pricing: text,
  visibility: text,
  subscriptionPlans: text,
  enrollmentFilter: text,
  earningFilter: text,
});
export type CourseFilters = z.infer<typeof courseFiltersSchema>;
export type CourseFilterKey = keyof CourseFilters;

export const EMPTY_FILTERS: Record<CourseFilterKey, null> = {
  search: null,
  courseType: null,
  category: null,
  teacher: null,
  status: null,
  pricing: null,
  visibility: null,
  subscriptionPlans: null,
  enrollmentFilter: null,
  earningFilter: null,
};

/** Number of filters in use (the search text counts as one). */
export const countActiveFilters = (filters: CourseFilters): number =>
  Object.values(filters).filter((value) => value !== '').length;

/**
 * The request parameters: only filled values. Moderators only ever see published courses (as in the old
 * client), so their status is fixed.
 */
export const toCourseQuery = (filters: CourseFilters, isModerator: boolean): AdminCourseQuery => {
  const query: AdminCourseQuery = {};
  (Object.entries(filters) as [CourseFilterKey, string][]).forEach(([key, value]) => {
    const trimmed = value.trim();
    if (trimmed !== '') query[key] = trimmed;
  });
  if (isModerator) query.status = 'Published';
  return query;
};

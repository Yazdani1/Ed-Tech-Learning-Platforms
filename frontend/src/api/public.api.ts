'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  coursePageSchema,
  heroPostSchema,
  siteLogoSchema,
  adminTeacherSchema,
  type CoursePage,
  type CourseSectionSource,
  type HeroPost,
  type HomeCourseFilters,
  type PlanCourseFilters,
  type SiteLogo,
  type AdminTeacher,
} from '@/schemas/public.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

/** Courses per page in a home page course section; the pagination shows only when there are more. */
export const HOME_COURSES_PAGE_SIZE = 30;
/** The "included courses" dialog on /pricing loads up to the backend's maximum page size. */
const PLAN_COURSES_LIMIT = 100;
/** Site chrome (logo, banner) rarely changes: keep it for five minutes. */
const CHROME_STALE_MS = 5 * 60 * 1000;

// Categories, course types, plans, the student's enrolments and subscription, subscribing: catalog.api.ts.

// ---- Requests ----

export const getSiteLogo = (): Promise<SiteLogo> =>
  http.get('/api/home-hero-posts/logo/public', siteLogoSchema);

export const getHeroPosts = (): Promise<HeroPost[]> =>
  http.get('/api/home-hero-posts/public', z.array(heroPostSchema));

/** Every teacher profile (Super Admin / Admin also receive `userId` and `createdAt`). */
export const getTeachers = (): Promise<AdminTeacher[]> =>
  http.get('/api/teachers', z.array(adminTeacherSchema));

/** The browse filter of a course section. */
const sourceParams = (source: CourseSectionSource): Record<string, string> => {
  if (source.kind === 'free') return { pricing: 'Free' };
  return { courseTypes: source.courseTypeId, pricing: 'Paid' };
};

/** Course count per category for a section's category cards (from the browse filterCounts). */
export const sectionCategoryCounts = (
  source: CourseSectionSource,
  counts: CoursePage['filterCounts'],
): Record<string, number> | undefined => {
  if (source.kind === 'free') return counts?.categoriesByPricing.Free;
  return counts?.paidByCourseType[source.courseTypeId]?.categories;
};

/** One section's page: the free courses, or one course type's paid courses. */
export const getHomeCourses = ({
  source,
  category,
  page,
}: HomeCourseFilters): Promise<CoursePage> =>
  http.getEnvelope('/api/courses/browse', coursePageSchema, {
    params: {
      ...sourceParams(source),
      categories: category || undefined,
      page,
      limit: HOME_COURSES_PAGE_SIZE,
    },
  });

/** Only the counts (which course types have paid courses, free total): the catalog's section list. */
export const getCatalogCounts = (): Promise<CoursePage> =>
  http.getEnvelope('/api/courses/browse', coursePageSchema, { params: { page: 1, limit: 1 } });

export const getPlanCourses = (plan: string, filters: PlanCourseFilters): Promise<CoursePage> =>
  http.getEnvelope('/api/courses/browse', coursePageSchema, {
    params: {
      subscriptionPlans: plan,
      limit: PLAN_COURSES_LIMIT,
      search: filters.search.trim() || undefined,
      categories: filters.category || undefined,
      courseTypes: filters.courseType || undefined,
      pricing: filters.pricing || undefined,
    },
  });

// ---- Hooks ----

export const useSiteLogo = (): UseQueryResult<SiteLogo, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.siteLogo,
    queryFn: getSiteLogo,
    staleTime: CHROME_STALE_MS,
  });

export const useHeroPosts = (): UseQueryResult<HeroPost[], ApiError> =>
  useQuery({ queryKey: queryKeys.public.heroPosts, queryFn: getHeroPosts });

export const useTeachers = (): UseQueryResult<AdminTeacher[], ApiError> =>
  useQuery({ queryKey: queryKeys.public.teachers, queryFn: getTeachers });

export const useHomeCourses = (filters: HomeCourseFilters): UseQueryResult<CoursePage, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.homeCourses({
      ...sourceParams(filters.source),
      category: filters.category,
      page: filters.page,
    }),
    queryFn: () => getHomeCourses(filters),
    placeholderData: keepPreviousData,
  });

export const usePlanCourses = (
  plan: string | undefined,
  filters: PlanCourseFilters,
): UseQueryResult<CoursePage, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.planCourses(plan ?? '', { ...filters }),
    queryFn: () => getPlanCourses(plan ?? '', filters),
    enabled: Boolean(plan),
    placeholderData: keepPreviousData,
  });

export const useCatalogCounts = (): UseQueryResult<CoursePage, ApiError> =>
  useQuery({ queryKey: queryKeys.public.catalogCounts, queryFn: getCatalogCounts });

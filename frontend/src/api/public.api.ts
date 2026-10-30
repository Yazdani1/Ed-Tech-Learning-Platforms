'use client';

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  activeDiscountSchema,
  coursePageSchema,
  heroPostSchema,
  siteLogoSchema,
  teacherProfileSchema,
  type ActiveDiscount,
  type CoursePage,
  type HeroPost,
  type PlanCourseFilters,
  type SiteLogo,
  type TeacherProfile,
} from '@/schemas/public.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

/** Courses per page in the home page's "Popular Courses" grid (same as the old client). */
export const HOME_COURSES_PAGE_SIZE = 8;
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

export const getActiveDiscount = (): Promise<ActiveDiscount> =>
  http.get('/api/courses/discounts/active', activeDiscountSchema);

export const getTeachers = (): Promise<TeacherProfile[]> =>
  http.get('/api/teachers', z.array(teacherProfileSchema));

export const getHomeCourses = (page: number): Promise<CoursePage> =>
  http.getEnvelope('/api/courses/browse', coursePageSchema, {
    params: { page, limit: HOME_COURSES_PAGE_SIZE },
  });

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

export const useActiveDiscount = (): UseQueryResult<ActiveDiscount, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.activeDiscount,
    queryFn: getActiveDiscount,
    staleTime: CHROME_STALE_MS,
  });

export const useTeachers = (): UseQueryResult<TeacherProfile[], ApiError> =>
  useQuery({ queryKey: queryKeys.public.teachers, queryFn: getTeachers });

export const useHomeCourses = (page: number): UseQueryResult<CoursePage, ApiError> =>
  useQuery({
    queryKey: queryKeys.public.homeCourses(page),
    queryFn: () => getHomeCourses(page),
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

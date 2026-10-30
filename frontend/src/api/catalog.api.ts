'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  enrolledCourseSchema,
  subscriptionPlanSchema,
  subscriptionSchema,
  taxonomySchema,
  type EnrolledCourse,
  type Subscription,
  type SubscriptionPlan,
  type Taxonomy,
  type TaxonomyKind,
} from '@/schemas/catalog.schema';

export type { TaxonomyKind } from '@/schemas/catalog.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Catalog reads shared by the public site, course browser, student area, profile and course setup: ONE
// request, hook and query key per endpoint, so every screen reads (and refreshes) the same cache entry.

export const TAXONOMY_PATHS: Record<TaxonomyKind, string> = {
  category: '/api/categories',
  courseType: '/api/course-types',
};

export const TAXONOMY_KEYS = {
  category: queryKeys.catalog.categories,
  courseType: queryKeys.catalog.courseTypes,
} as const;

/** POST /api/enrollments/:courseId body: `paid` buys the course even when a subscription covers it. */
export interface EnrollRequest {
  enrollmentType?: 'paid';
}

/** POST /api/subscriptions/subscribe body (the price is always taken from the plan on the server). */
export interface SubscribeRequest {
  plan: string;
  billingDuration: number;
}

const courseUrl = (courseId: string): string => `/api/enrollments/${encodeURIComponent(courseId)}`;

// ---- Requests ----

export const getTaxonomy = (kind: TaxonomyKind): Promise<Taxonomy[]> =>
  http.get(TAXONOMY_PATHS[kind], z.array(taxonomySchema));

export const getSubscriptionPlans = (): Promise<SubscriptionPlan[]> =>
  http.get('/api/subscription-plans', z.array(subscriptionPlanSchema));

/** The signed-in student's enrolled courses, newest first (each with its enrolment type). */
export const getMyEnrollments = (): Promise<EnrolledCourse[]> =>
  http.get('/api/enrollments', z.array(enrolledCourseSchema));

export const getMySubscription = (): Promise<Subscription | null> =>
  http.get('/api/subscriptions/my', subscriptionSchema.nullable());

export const enroll = async (courseId: string, body: EnrollRequest): Promise<void> => {
  await http.send('POST', courseUrl(courseId), body);
};

export const unenroll = async (courseId: string): Promise<void> => {
  await http.send('DELETE', courseUrl(courseId));
};

/** Activates the plan at once (no payment gateway yet); the price comes from the plan on the server. */
export const subscribe = (body: SubscribeRequest): Promise<Subscription> =>
  http.post('/api/subscriptions/subscribe', body, subscriptionSchema);

export const cancelMySubscription = async (): Promise<void> => {
  await http.send('DELETE', '/api/subscriptions/cancel-my');
};

// ---- Cache refresh after a change (every screen showing enrolments or the plan stays in sync) ----

const refresh = (queryClient: QueryClient, keys: readonly (readonly unknown[])[]): Promise<void> =>
  Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
    () => undefined,
  );

/** After enrolling or leaving: My Courses, "enrolled" badges, the course page and the profile counts. */
export const refreshEnrollments = (queryClient: QueryClient): Promise<void> =>
  refresh(queryClient, [
    queryKeys.catalog.myEnrollments,
    queryKeys.browse.all,
    queryKeys.profile.me,
    queryKeys.auth.me,
  ]);

/** What else shows the plan: enrolments made through it, the course page, the profile, the shell user. */
const SUBSCRIPTION_DEPENDENTS = [
  queryKeys.catalog.myEnrollments,
  queryKeys.browse.all,
  queryKeys.profile.me,
  queryKeys.auth.me,
] as const;

/**
 * After subscribing or cancelling: the plan everywhere (pricing, course page, profile, shell user).
 * `known`: the new subscription the server just returned (stored as is, not fetched again).
 */
export const refreshSubscription = (
  queryClient: QueryClient,
  known?: Subscription,
): Promise<void> => {
  if (known) {
    queryClient.setQueryData(queryKeys.catalog.mySubscription, known);
    return refresh(queryClient, SUBSCRIPTION_DEPENDENTS);
  }
  return refresh(queryClient, [queryKeys.catalog.mySubscription, ...SUBSCRIPTION_DEPENDENTS]);
};

// ---- Hooks ----

export const useTaxonomy = (kind: TaxonomyKind): UseQueryResult<Taxonomy[], ApiError> =>
  useQuery({ queryKey: TAXONOMY_KEYS[kind], queryFn: () => getTaxonomy(kind) });

export const useCategories = (): UseQueryResult<Taxonomy[], ApiError> => useTaxonomy('category');

export const useCourseTypes = (): UseQueryResult<Taxonomy[], ApiError> => useTaxonomy('courseType');

export const useSubscriptionPlans = (): UseQueryResult<SubscriptionPlan[], ApiError> =>
  useQuery({ queryKey: queryKeys.catalog.plans, queryFn: getSubscriptionPlans });

/** `enabled` false: nothing is requested (the endpoint is for students only). */
export const useMyEnrollments = (enabled = true): UseQueryResult<EnrolledCourse[], ApiError> =>
  useQuery({ queryKey: queryKeys.catalog.myEnrollments, queryFn: getMyEnrollments, enabled });

const toCourseIds = (courses: EnrolledCourse[]): string[] => courses.map((course) => course._id);

/** Ids of the signed-in Student's courses (same cache entry as My Courses). */
export const useEnrolledCourseIds = (enabled: boolean): UseQueryResult<string[], ApiError> =>
  useQuery({
    queryKey: queryKeys.catalog.myEnrollments,
    queryFn: getMyEnrollments,
    enabled,
    select: toCourseIds,
  });

/** The signed-in Student's active subscription, or null (only asked for Students). */
export const useMySubscription = (
  enabled: boolean,
): UseQueryResult<Subscription | null, ApiError> =>
  useQuery({ queryKey: queryKeys.catalog.mySubscription, queryFn: getMySubscription, enabled });

export const useEnroll = (courseId: string): UseMutationResult<void, ApiError, EnrollRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => enroll(courseId, body),
    onSuccess: () => refreshEnrollments(queryClient),
  });
};

/** Removes the student's own enrolment (variables: the course id); the course leaves My Courses at once. */
export const useUnenroll = (): UseMutationResult<void, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unenroll,
    onSuccess: (_data, courseId) => {
      queryClient.setQueryData<EnrolledCourse[]>(queryKeys.catalog.myEnrollments, (current) =>
        current?.filter((course) => course._id !== courseId),
      );
      return refreshEnrollments(queryClient);
    },
  });
};

export const useSubscribe = (): UseMutationResult<Subscription, ApiError, SubscribeRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: subscribe,
    onSuccess: (subscription) => refreshSubscription(queryClient, subscription),
  });
};

export const useCancelSubscription = (): UseMutationResult<void, ApiError, void> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelMySubscription,
    onSuccess: () => refreshSubscription(queryClient),
  });
};

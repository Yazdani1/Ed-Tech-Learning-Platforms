'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { adminTeacherSchema, type AdminTeacher } from '@/schemas/public.schema';
import {
  courseQuestionGroupSchema,
  managedUserSchema,
  subscriptionsEnvelopeSchema,
  usersEnvelopeSchema,
  type AssignRequest,
  type CourseQuestionGroup,
  type ManagedUser,
  type PlanRequest,
  type SubscriptionsPage,
  type UserCreateRequest,
  type UsersPage,
} from '@/schemas/people.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { UserRole } from '@/types';

// People administration. Plans are read with catalog.api's useSubscriptionPlans (one key per endpoint);
// saving or deleting a plan refreshes that shared entry.

export type ListParams = Record<string, string | number>;

const id = (value: string): string => encodeURIComponent(value);

/** Drops empty values so the URL only carries the filters that are set. */
const compact = (params: ListParams): ListParams =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== ''));

// ---- Users ----

export interface UserUpdateRequest {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export const getUsers = (params: ListParams): Promise<UsersPage> =>
  http.getEnvelope('/api/users', usersEnvelopeSchema, { params: compact(params) });

export const createUser = (body: UserCreateRequest): Promise<ManagedUser> =>
  http.post('/api/users', body, managedUserSchema);

export const updateUser = (userId: string, body: UserUpdateRequest): Promise<ManagedUser> =>
  http.put(`/api/users/${id(userId)}`, body, managedUserSchema);

export const updateUserRole = (userId: string, role: UserRole): Promise<ManagedUser> =>
  http.put(`/api/users/${id(userId)}/role`, { role }, managedUserSchema);

export const deleteUser = async (userId: string): Promise<void> => {
  await http.send('DELETE', `/api/users/${id(userId)}`);
};

// ---- Teachers ----

export interface SaveTeacherInput {
  teacherId?: string;
  body: FormData;
}

export const saveTeacher = ({ teacherId, body }: SaveTeacherInput): Promise<AdminTeacher> =>
  teacherId
    ? http.put(`/api/teachers/${id(teacherId)}`, body, adminTeacherSchema)
    : http.post('/api/teachers', body, adminTeacherSchema);

export const deleteTeacher = async (teacherId: string): Promise<void> => {
  await http.send('DELETE', `/api/teachers/${id(teacherId)}`);
};

// ---- Subscriptions and plans ----

export const getSubscriptions = (params: ListParams): Promise<SubscriptionsPage> =>
  http.getEnvelope('/api/subscriptions', subscriptionsEnvelopeSchema, { params: compact(params) });

export const assignSubscription = async (body: AssignRequest): Promise<void> => {
  await http.send('POST', '/api/subscriptions/assign', body);
};

export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  await http.send('PATCH', `/api/subscriptions/${id(subscriptionId)}/cancel`);
};

export const savePlan = async (body: PlanRequest): Promise<void> => {
  await http.send('POST', '/api/subscription-plans', body);
};

export const deletePlan = async (planId: string): Promise<void> => {
  await http.send('DELETE', `/api/subscription-plans/${id(planId)}`);
};

// ---- Course Q&A (staff overview; answering happens in the course player, learn-qa.api.ts) ----

export const getQuestionGroups = (): Promise<CourseQuestionGroup[]> =>
  http.get('/api/qa/admin/course-questions', z.array(courseQuestionGroupSchema));

// ---- Hooks ----

/** A mutation that refreshes these cache entries when it succeeds. */
const useRefreshingMutation = <TVars>(
  mutationFn: (vars: TVars) => Promise<unknown>,
  keys: readonly QueryKey[],
): UseMutationResult<void, ApiError, TVars> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: TVars) => {
      await mutationFn(vars);
    },
    onSuccess: () =>
      Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
        () => undefined,
      ),
  });
};

export const useUsers = (params: ListParams, enabled = true): UseQueryResult<UsersPage, ApiError> =>
  useQuery({
    queryKey: queryKeys.people.userList(compact(params)),
    queryFn: () => getUsers(params),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useCreateUser = (): UseMutationResult<void, ApiError, UserCreateRequest> =>
  useRefreshingMutation(createUser, [queryKeys.people.users]);

export const useUpdateUser = (): UseMutationResult<
  void,
  ApiError,
  { userId: string; body: UserUpdateRequest }
> =>
  useRefreshingMutation(
    ({ userId, body }) => updateUser(userId, body),
    [queryKeys.people.users, queryKeys.auth.me],
  );

export const useUpdateUserRole = (): UseMutationResult<
  void,
  ApiError,
  { userId: string; role: UserRole }
> =>
  useRefreshingMutation(
    ({ userId, role }) => updateUserRole(userId, role),
    [queryKeys.people.users, queryKeys.auth.me],
  );

export const useDeleteUser = (): UseMutationResult<void, ApiError, string> =>
  useRefreshingMutation(deleteUser, [queryKeys.people.users, queryKeys.people.subscriptions]);

/** Teacher profiles are read with public.api useTeachers; the staff course list shows their names. */
const TEACHER_KEYS = [queryKeys.public.teachers, queryKeys.adminCourses.all] as const;

export const useSaveTeacher = (): UseMutationResult<void, ApiError, SaveTeacherInput> =>
  useRefreshingMutation(saveTeacher, TEACHER_KEYS);

export const useDeleteTeacher = (): UseMutationResult<void, ApiError, string> =>
  useRefreshingMutation(deleteTeacher, TEACHER_KEYS);

export const useSubscriptions = (params: ListParams): UseQueryResult<SubscriptionsPage, ApiError> =>
  useQuery({
    queryKey: queryKeys.people.subscriptionList(compact(params)),
    queryFn: () => getSubscriptions(params),
    placeholderData: keepPreviousData,
  });

const SUBSCRIPTION_KEYS = [queryKeys.people.subscriptions, queryKeys.people.users] as const;

export const useAssignSubscription = (): UseMutationResult<void, ApiError, AssignRequest> =>
  useRefreshingMutation(assignSubscription, SUBSCRIPTION_KEYS);

export const useCancelMemberSubscription = (): UseMutationResult<void, ApiError, string> =>
  useRefreshingMutation(cancelSubscription, SUBSCRIPTION_KEYS);

export const useSavePlan = (): UseMutationResult<void, ApiError, PlanRequest> =>
  useRefreshingMutation(savePlan, [queryKeys.catalog.plans]);

export const useDeletePlan = (): UseMutationResult<void, ApiError, string> =>
  useRefreshingMutation(deletePlan, [queryKeys.catalog.plans]);

export const useQuestionGroups = (): UseQueryResult<CourseQuestionGroup[], ApiError> =>
  useQuery({ queryKey: queryKeys.people.qaGroups, queryFn: getQuestionGroups });

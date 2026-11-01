'use client';

import {
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  scheduleSchema,
  type CreateReminderInput,
  type CreateTimerInput,
  type Schedule,
  type ScheduleFilters,
  type UpdateScheduleBody,
} from '@/schemas/schedule.schema';
import { http, type ApiError } from '@/services/http.service';

import { useInvalidatingMutation } from './invalidating-mutation';
import { queryKeys } from './query-keys';

const BASE = '/api/study-schedules';

// ---- Requests ----

/** My timers and reminders, newest first (optional type / status filters). */
export const getSchedules = async (filters: ScheduleFilters = {}): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return (await http.list(query ? `${BASE}?${query}` : BASE, scheduleSchema)).items;
};

export const createTimer = (input: CreateTimerInput): Promise<Schedule> =>
  http.post(`${BASE}/timer`, input, scheduleSchema);

export const createReminder = (input: CreateReminderInput): Promise<Schedule> =>
  http.post(`${BASE}/reminder`, input, scheduleSchema);

export interface UpdateScheduleInput {
  id: string;
  body: UpdateScheduleBody;
}

export const updateSchedule = ({ id, body }: UpdateScheduleInput): Promise<Schedule> =>
  http.put(`${BASE}/${id}`, body, scheduleSchema);

export const deleteSchedule = async (id: string): Promise<void> => {
  await http.send('DELETE', `${BASE}/${id}`);
};

// ---- Hooks ----

export const useSchedules = (filters: ScheduleFilters): UseQueryResult<Schedule[], ApiError> =>
  useQuery({
    queryKey: queryKeys.schedule.list({ type: filters.type ?? '', status: filters.status ?? '' }),
    queryFn: () => getSchedules(filters),
  });

/** Puts the saved item into every cached list at once (the clock must not wait for the refetch). */
const putInCache = (queryClient: QueryClient, saved: Schedule): void => {
  queryClient.setQueriesData<Schedule[]>({ queryKey: queryKeys.schedule.all }, (current) =>
    current?.map((item) => (item._id === saved._id ? saved : item)),
  );
};

const SCHEDULE_KEYS = [queryKeys.schedule.all] as const;

const useScheduleMutation = <TData, TInput>(
  mutationFn: (input: TInput) => Promise<TData>,
): UseMutationResult<TData, ApiError, TInput> => {
  const queryClient = useQueryClient();
  return useInvalidatingMutation(mutationFn, SCHEDULE_KEYS, {
    refreshOn: 'settled',
    onSuccess: (data) => {
      const parsed = scheduleSchema.safeParse(data);
      if (parsed.success) putInCache(queryClient, parsed.data);
    },
  });
};

export const useCreateTimer = (): UseMutationResult<Schedule, ApiError, CreateTimerInput> =>
  useScheduleMutation(createTimer);

export const useCreateReminder = (): UseMutationResult<Schedule, ApiError, CreateReminderInput> =>
  useScheduleMutation(createReminder);

export const useUpdateSchedule = (): UseMutationResult<Schedule, ApiError, UpdateScheduleInput> =>
  useScheduleMutation(updateSchedule);

export const useDeleteSchedule = (): UseMutationResult<void, ApiError, string> =>
  useScheduleMutation(deleteSchedule);

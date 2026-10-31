'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import { userSchema } from '@/schemas/auth.schema';
import { profileSchema, type Profile } from '@/schemas/profile.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// The teacher's course count: teacher.api.ts useMyTeacherCourseCount. Plans, the student's enrolments and cancelling the subscription are shared reads: catalog.api.ts.

const ME = '/api/auth/me';

// ---- Requests ----

export const getProfile = (): Promise<Profile> => http.get(ME, profileSchema);

/** Multipart PUT (name, email, avatar, removeAvatar, isCommunityProfilePrivate, passwords). */
export const updateProfile = (body: FormData): Promise<Profile> =>
  http.put(ME, body, profileSchema);

// ---- Hooks ----

export const useProfile = (): UseQueryResult<Profile, ApiError> =>
  useQuery({ queryKey: queryKeys.profile.me, queryFn: getProfile });

/** After a save, the profile and the shell's "me" query show the new values at once. */
export const useUpdateProfile = (): UseMutationResult<Profile, ApiError, FormData> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.me, profile);
      queryClient.setQueryData(queryKeys.auth.me, userSchema.parse(profile));
    },
  });
};

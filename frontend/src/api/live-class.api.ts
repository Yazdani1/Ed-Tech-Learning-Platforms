'use client';

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { z } from 'zod';

import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { LiveClassRequest } from '@/schemas/learn.schema';

// Live classes (study curricula): add, edit and delete a week, from the course editor and the course player.
// Both screens (and the public course page) read the weeks with browse.api useLiveClasses: one request and
// one cache entry, refreshed after every change here.

const enc = encodeURIComponent;

/** POST/PUT answer the saved week (only its id is needed: the list is read again). */
const savedWeekSchema = z.object({ _id: z.string() });

export interface SaveLiveClassVariables {
  /** Set to edit, undefined to add a week */
  id?: string;
  body: LiveClassRequest;
}

export const saveLiveClass = async (
  courseId: string,
  { id, body }: SaveLiveClassVariables,
): Promise<void> => {
  await (id
    ? http.put(`/api/study-curricula/${enc(id)}`, body, savedWeekSchema)
    : http.post(`/api/study-curricula/course/${enc(courseId)}`, body, savedWeekSchema));
};

export const deleteLiveClass = async (id: string): Promise<void> => {
  await http.send('DELETE', `/api/study-curricula/${enc(id)}`);
};

const useRefreshLiveClasses = (courseId: string): (() => Promise<void>) => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.browse.liveClasses(courseId) });
};

export const useSaveLiveClass = (
  courseId: string,
): UseMutationResult<void, ApiError, SaveLiveClassVariables> => {
  const refresh = useRefreshLiveClasses(courseId);
  return useMutation({
    mutationFn: (variables) => saveLiveClass(courseId, variables),
    onSuccess: refresh,
  });
};

export const useDeleteLiveClass = (courseId: string): UseMutationResult<void, ApiError, string> => {
  const refresh = useRefreshLiveClasses(courseId);
  return useMutation({ mutationFn: deleteLiveClass, onSuccess: refresh });
};

'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import {
  broadcastDetailsSchema,
  broadcastSchema,
  type Broadcast,
  type BroadcastDetails,
} from '@/schemas/announcement-broadcast.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

import type { ListResult } from '@/types';

const BROADCASTS = '/api/announcements/broadcasts';
const UPLOAD_TIMEOUT_MS = 60_000;

export interface SendBroadcastInput {
  title: string;
  /** Rich text from the editor */
  description: string;
  courseIds: string[];
  image: File | null;
}

// ---- Requests ----

export const getBroadcasts = (page: number, limit: number): Promise<ListResult<Broadcast>> =>
  http.list(BROADCASTS, broadcastSchema, { params: { page, limit } });

export const getBroadcast = (id: string): Promise<BroadcastDetails> =>
  http.get(`${BROADCASTS}/${encodeURIComponent(id)}`, broadcastDetailsSchema);

/** Multipart: one announcement in each selected published course. */
export const sendBroadcast = ({ title, description, courseIds, image }: SendBroadcastInput) => {
  const body = new FormData();
  body.append('title', title);
  body.append('description', description);
  body.append('courseIds', JSON.stringify(courseIds));
  if (image) body.append('image', image);
  return http.post(BROADCASTS, body, z.object({ _id: z.string() }), {
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
};

// ---- Hooks ----

export const useBroadcasts = (
  page: number,
  limit: number,
): UseQueryResult<ListResult<Broadcast>, ApiError> =>
  useQuery({
    queryKey: queryKeys.broadcasts.list({ page, limit }),
    queryFn: () => getBroadcasts(page, limit),
    placeholderData: keepPreviousData,
  });

/** Loads only while one is open (id given). */
export const useBroadcast = (id: string | undefined): UseQueryResult<BroadcastDetails, ApiError> =>
  useQuery({
    queryKey: queryKeys.broadcasts.detail(id ?? ''),
    queryFn: () => getBroadcast(id ?? ''),
    enabled: Boolean(id),
  });

export const useSendBroadcast = (): UseMutationResult<
  { _id: string },
  ApiError,
  SendBroadcastInput
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendBroadcast,
    // The courses' announcement lists (course player) show the new one too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learn.all }),
      ]),
  });
};

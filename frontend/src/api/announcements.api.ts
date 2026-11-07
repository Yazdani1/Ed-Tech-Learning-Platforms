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
import { auditHistorySchema, type AuditEntry } from '@/schemas/audit.schema';
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

export interface UpdateBroadcastInput {
  id: string;
  title: string;
  description: string;
  /** A new picture, or removeImage to take the current one away */
  image: File | null;
  removeImage: boolean;
}

/** Multipart: changes the text (and picture) in every course it was sent to; the old text goes to its history. */
export const updateBroadcast = ({
  id,
  title,
  description,
  image,
  removeImage,
}: UpdateBroadcastInput) => {
  const body = new FormData();
  body.append('title', title);
  body.append('description', description);
  if (image) body.append('image', image);
  else if (removeImage) body.append('removeImage', 'true');
  return http.put(`${BROADCASTS}/${encodeURIComponent(id)}`, body, z.object({ _id: z.string() }), {
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
};

/** "Delete": archived (hidden for students and admins), never removed from the database. */
export const archiveBroadcast = async (id: string): Promise<void> => {
  await http.send('DELETE', `${BROADCASTS}/${encodeURIComponent(id)}`);
};

export const getBroadcastHistory = (id: string): Promise<AuditEntry[]> =>
  http.get(`${BROADCASTS}/${encodeURIComponent(id)}/history`, auditHistorySchema);

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

const useBroadcastChange = <Input>(
  mutationFn: (input: Input) => Promise<unknown>,
): UseMutationResult<unknown, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // The course player's announcement lists change too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.broadcasts.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.learn.all }),
      ]),
  });
};

export const useUpdateBroadcast = () => useBroadcastChange(updateBroadcast);

export const useArchiveBroadcast = () => useBroadcastChange(archiveBroadcast);

/** Every edit of one announcement (loads while its history is open). */
export const useBroadcastHistory = (
  id: string | undefined,
): UseQueryResult<AuditEntry[], ApiError> =>
  useQuery({
    queryKey: queryKeys.broadcasts.history(id ?? ''),
    queryFn: () => getBroadcastHistory(id ?? ''),
    enabled: Boolean(id),
  });

'use client';

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  setupItemSchema,
  type SetupItem,
  type SetupItemRequest,
  type SetupKind,
} from '@/schemas/setup.schema';
import { http, type ApiError } from '@/services/http.service';

import { TAXONOMY_KEYS, TAXONOMY_PATHS, useTaxonomy } from './catalog.api';

// The list itself is the shared catalog read (one cache entry for this screen, the public catalog filters
// and the course browser), so a save or delete here refreshes every screen at once.

// ---- Requests ----

export interface SaveSetupItemInput {
  /** Set when editing; absent when creating */
  id?: string;
  body: SetupItemRequest;
}

export const saveSetupItem = (
  kind: SetupKind,
  { id, body }: SaveSetupItemInput,
): Promise<SetupItem> =>
  id
    ? http.put(`${TAXONOMY_PATHS[kind]}/${encodeURIComponent(id)}`, body, setupItemSchema)
    : http.post(TAXONOMY_PATHS[kind], body, setupItemSchema);

/** The backend refuses (400, with a message) to delete an item that courses still use. */
export const deleteSetupItem = async (kind: SetupKind, id: string): Promise<void> => {
  await http.send('DELETE', `${TAXONOMY_PATHS[kind]}/${encodeURIComponent(id)}`);
};

// ---- Hooks ----

export const useSetupItems = (kind: SetupKind): UseQueryResult<SetupItem[], ApiError> =>
  useTaxonomy(kind);

export const useSaveSetupItem = (
  kind: SetupKind,
): UseMutationResult<SetupItem, ApiError, SaveSetupItemInput> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => saveSetupItem(kind, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAXONOMY_KEYS[kind] }),
  });
};

export const useDeleteSetupItem = (kind: SetupKind): UseMutationResult<void, ApiError, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteSetupItem(kind, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TAXONOMY_KEYS[kind] }),
  });
};

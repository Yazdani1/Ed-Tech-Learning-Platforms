'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { ApiError } from '@/services/http.service';

export interface InvalidatingMutationOptions<TData> {
  /** 'success' (default): refresh only after the change worked; 'settled': also after it failed. */
  refreshOn?: 'success' | 'settled';
  /** Runs before the refresh, e.g. to put the saved item into the cache at once. */
  onSuccess?: (data: TData) => void;
}

/**
 * A mutation that marks these cache entries stale (so they are fetched again) when it finishes. The
 * returned promise of `mutateAsync` resolves after the refresh, so a success toast follows fresh data.
 */
export const useInvalidatingMutation = <TData, TInput>(
  mutationFn: (input: TInput) => Promise<TData>,
  keys: readonly QueryKey[],
  options: InvalidatingMutationOptions<TData> = {},
): UseMutationResult<TData, ApiError, TInput> => {
  const queryClient = useQueryClient();
  const refresh = (): Promise<void> =>
    Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))).then(
      () => undefined,
    );
  const settled = options.refreshOn === 'settled';
  return useMutation({
    mutationFn,
    onSuccess: async (data) => {
      options.onSuccess?.(data);
      if (!settled) await refresh();
    },
    onSettled: settled ? refresh : undefined,
  });
};

/** Adapts a request whose result the caller does not need into a mutation returning nothing. */
export const discardResult =
  <TInput>(request: (input: TInput) => Promise<unknown>) =>
  async (input: TInput): Promise<void> => {
    await request(input);
  };

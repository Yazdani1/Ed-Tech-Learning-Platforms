import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { isApiError, NETWORK_ERROR_STATUS } from '@/services/http.service';

import { queryKeys } from './query-keys';

const STALE_TIME_MS = 30_000;
const MAX_NETWORK_RETRIES = 2;
const HTTP_UNAUTHORIZED = 401;

/** The app-wide TanStack Query client: caching, retries and global API error handling. */
export const createQueryClient = (): QueryClient => {
  // Any API call answered with 401 means the session ended (expired cookie, logged out elsewhere):
  // mark the user as signed out, so RequireRole sends them to the sign-in page.
  const onError = (error: unknown): void => {
    if (isApiError(error, HTTP_UNAUTHORIZED)) queryClient.setQueryData(queryKeys.auth.me, null);
  };
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: false,
        // Retry only network failures, never API errors such as 401/403/404
        retry: (failureCount, error) =>
          isApiError(error, NETWORK_ERROR_STATUS) && failureCount < MAX_NETWORK_RETRIES,
      },
    },
  });
  return queryClient;
};

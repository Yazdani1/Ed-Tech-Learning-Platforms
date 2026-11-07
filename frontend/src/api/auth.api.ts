'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import {
  userSchema,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from '@/schemas/auth.schema';
import { http, isApiError, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

const AUTH = '/api/auth';
const HTTP_UNAUTHORIZED = 401;
/** /me answers 403 only for a blocked account */
const HTTP_FORBIDDEN = 403;

// ---- Requests (wrappers around the central http service) ----

/** Students: adds the seconds spent on the portal since the last report (see usePortalTimeTracker). */
export const reportPortalActivity = async (seconds: number): Promise<void> => {
  await http.send('POST', `${AUTH}/me/activity`, { seconds });
};

/**
 * The signed-in user, or null when nobody is signed in (401). A blocked account (403) is signed out: its
 * cookie is cleared so public pages work as for a guest.
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    return await http.get(`${AUTH}/me`, userSchema);
  } catch (error) {
    if (isApiError(error, HTTP_UNAUTHORIZED)) return null;
    if (isApiError(error, HTTP_FORBIDDEN)) {
      await http.send('POST', `${AUTH}/logout`).catch(() => undefined);
      return null;
    }
    throw error;
  }
};

/** Sets the httpOnly session cookie (the backend never puts the token in the body). */
export const login = (body: LoginRequest): Promise<User> =>
  http.post(`${AUTH}/login`, body, userSchema);

export const register = (body: RegisterRequest): Promise<User> =>
  http.post(`${AUTH}/register`, body, userSchema);

/** Clears the session cookie (the response has no data). */
export const logout = async (): Promise<void> => {
  await http.send('POST', `${AUTH}/logout`);
};

// ---- Hooks used by components (TanStack Query caches and tracks loading/error state) ----

export const useCurrentUser = (): UseQueryResult<User | null, ApiError> =>
  useQuery({ queryKey: queryKeys.auth.me, queryFn: getCurrentUser });

/** After login/register: show the user at once, then load the full profile from /auth/me. */
const useSignedIn = (): ((user: User) => void) => {
  const queryClient = useQueryClient();
  return (user) => {
    queryClient.setQueryData(queryKeys.auth.me, user);
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  };
};

export const useLogin = (): UseMutationResult<User, ApiError, LoginRequest> => {
  const onSignedIn = useSignedIn();
  return useMutation({ mutationFn: login, onSuccess: onSignedIn });
};

export const useRegister = (): UseMutationResult<User, ApiError, RegisterRequest> => {
  const onSignedIn = useSignedIn();
  return useMutation({ mutationFn: register, onSuccess: onSignedIn });
};

export const useLogout = (): UseMutationResult<void, ApiError, void> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    // Only after the backend cleared the cookie: mark the user signed out (RequireRole then opens
    // the sign-in panel) and drop every other cached query, so no data from this session stays in memory.
    // The "me" query itself is kept, not removed, so its observers see the change.
    // If the request fails the user stays signed in (the cookie is still valid) and the caller shows an
    // error instead of pretending the sign-out worked.
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null);
      queryClient.removeQueries({
        predicate: (query) => query.queryHash !== JSON.stringify(queryKeys.auth.me),
      });
    },
  });
};

'use client';

import { useCurrentUser } from '@/api/auth.api';
import { hasRole } from '@/utils/roles';

import type { User } from '@/schemas/auth.schema';
import type { ApiError } from '@/services/http.service';
import type { UserRole } from '@/types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** The "me" check itself failed (server or network error); signed-out (401) is not an error */
  error: ApiError | null;
  retry: () => void;
  hasRole: (roles: readonly UserRole[]) => boolean;
}

/** The signed-in user from the cached "me" query (no separate auth context). */
export const useAuth = (): AuthState => {
  const { data, isPending, error, refetch } = useCurrentUser();
  const user = data ?? null;
  return {
    user,
    isLoading: isPending,
    isAuthenticated: user !== null,
    error,
    retry: () => void refetch(),
    hasRole: (roles) => hasRole(user?.role, roles),
  };
};

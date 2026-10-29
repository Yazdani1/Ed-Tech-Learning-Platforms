'use client';

import { useAuth } from '@/hooks/useAuth';

import type { UserRole } from '@/types';
import type { FC, ReactNode } from 'react';

interface CanProps {
  roles: readonly UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Shows an action only to these roles. The backend still checks every request; this only hides UI. */
export const Can: FC<CanProps> = ({ roles, children, fallback = null }) => {
  const { hasRole } = useAuth();
  return <>{hasRole(roles) ? children : fallback}</>;
};

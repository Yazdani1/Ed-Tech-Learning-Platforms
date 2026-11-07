'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePortalTimeTracker } from '@/hooks/usePortalTimeTracker';

/** Renders nothing: counts the time a signed-in student spends on the portal (any page). */
export const PortalTimeTracker = () => {
  const { user } = useAuth();
  usePortalTimeTracker(user?.role === 'Student');
  return null;
};

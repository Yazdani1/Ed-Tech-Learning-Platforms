'use client';

import { useEnrollmentCheck } from '@/api/browse.api';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROLES } from '@/utils/roles';

/** Visitors and students who have not enrolled yet can enrol (staff and teachers cannot). */
export const useCanEnroll = (courseId: string): boolean => {
  const { user, hasRole, isLoading } = useAuth();
  const isStudent = hasRole(STUDENT_ROLES);
  const check = useEnrollmentCheck(courseId, isStudent);
  if (isLoading || (user !== null && !isStudent)) return false;
  if (isStudent && check.isPending) return false;
  return !check.data?.isEnrolled;
};

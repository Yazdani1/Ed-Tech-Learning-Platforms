'use client';

import { useEnrolledCourseIds } from '@/api/catalog.api';

import { STUDENT_ROLES } from '@/utils/roles';

import { useAuth } from './useAuth';

const NONE: readonly string[] = [];

/** Ids of the courses the signed-in Student is enrolled in (empty for guests and other roles). */
export const useBrowseEnrolledIds = (): readonly string[] => {
  const { hasRole } = useAuth();
  const { data } = useEnrolledCourseIds(hasRole(STUDENT_ROLES));
  return data ?? NONE;
};

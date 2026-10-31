'use client';

import { useAuth } from '@/hooks/useAuth';
import { ADMIN_AREA_ROLES, MANAGER_ROLES, TEACHER_ROLES } from '@/utils/roles';

import type { PostedBy } from '@/schemas/learn.schema';
import type { UserRole } from '@/types';

/**
 * What the signed-in user may do in the course player: the same rules as the backend's checks. Anyone who
 * sees the player already has course access (a teacher there is a teacher of this course).
 */
export interface LearnPermissions {
  userId: string;
  role: UserRole | undefined;
  isStudent: boolean;
  /** Super Admin, Admin, Moderator */
  isStaffAdmin: boolean;
  /** Announcements and study materials: staff admins and the course's teachers */
  canPostContent: boolean;
  /** Live classes: Super Admin, Admin and the course's teachers (not Moderators) */
  canPostLiveClass: boolean;
  /** Students tab: everyone except students */
  canSeeStudents: boolean;
  /** CSV export: staff admins only */
  canExportStudents: boolean;
  /** Edit/delete a post: its author or a staff admin */
  canManage: (postedBy: PostedBy | null | undefined) => boolean;
  /** Resolve a question: staff admins, teachers, or the student who asked */
  canResolve: (postedBy: PostedBy | null | undefined) => boolean;
}

export const useLearnPermissions = (): LearnPermissions => {
  const { user, hasRole } = useAuth();
  const userId = user?._id ?? '';
  const isStaffAdmin = hasRole(ADMIN_AREA_ROLES);
  const isTeacher = hasRole(TEACHER_ROLES);
  const isAuthor = (postedBy: PostedBy | null | undefined): boolean =>
    userId !== '' && postedBy?._id === userId;
  return {
    userId,
    role: user?.role,
    isStudent: user?.role === 'Student',
    isStaffAdmin,
    canPostContent: isStaffAdmin || isTeacher,
    canPostLiveClass: hasRole(MANAGER_ROLES) || isTeacher,
    canSeeStudents: user !== null && user.role !== 'Student',
    canExportStudents: isStaffAdmin,
    canManage: (postedBy) => isStaffAdmin || isAuthor(postedBy),
    canResolve: (postedBy) => isStaffAdmin || isTeacher || isAuthor(postedBy),
  };
};

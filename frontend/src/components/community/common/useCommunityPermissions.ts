'use client';

import { useAuth } from '@/hooks/useAuth';
import { ADMIN_AREA_ROLES, MANAGER_ROLES } from '@/utils/roles';

import type { User } from '@/schemas/auth.schema';

export interface CommunityPermissions {
  user: User | null;
  /** Super Admin, Admin: settings, channels, badges, point rules, archived posts */
  isAdmin: boolean;
  /** Super Admin, Admin, Moderator: pin, edit and archive anything */
  canModerate: boolean;
  /** True when the signed-in user wrote the item (author id) */
  isMine: (authorId: string | undefined) => boolean;
  /** Edit/archive rule of the backend: the author or staff */
  canManage: (authorId: string | undefined) => boolean;
}

/** The same role rules as community.controller.ts, for hiding actions the user cannot take. */
export const useCommunityPermissions = (): CommunityPermissions => {
  const { user, hasRole } = useAuth();
  const canModerate = hasRole(ADMIN_AREA_ROLES);
  const isMine = (authorId: string | undefined): boolean =>
    user !== null && authorId !== undefined && user._id === authorId;
  return {
    user,
    isAdmin: hasRole(MANAGER_ROLES),
    canModerate,
    isMine,
    canManage: (authorId) => user !== null && (canModerate || isMine(authorId)),
  };
};

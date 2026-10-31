import type { ManagedUser } from '@/schemas/people.schema';
import type { UserRole } from '@/types';

export const USER_ROLES: readonly UserRole[] = [
  'Super Admin',
  'Admin',
  'Moderator',
  'Teacher',
  'Student',
];

/** Roles only a Super Admin may give, edit or take away (backend: PROTECTED_ROLES). */
const PROTECTED_ROLES: readonly UserRole[] = ['Super Admin', 'Admin'];

type ChipColor = 'primary' | 'secondary' | 'success' | 'warning' | 'info';

export const ROLE_CHIP_COLOR: Record<UserRole, ChipColor> = {
  'Super Admin': 'secondary',
  Admin: 'primary',
  Moderator: 'warning',
  Teacher: 'info',
  Student: 'success',
};

/** i18n key of a role name (people.roles.<key>). */
export const ROLE_KEY: Record<UserRole, string> = {
  'Super Admin': 'superAdmin',
  Admin: 'admin',
  Moderator: 'moderator',
  Teacher: 'teacher',
  Student: 'student',
};

/** Roles this viewer may give (an Admin cannot create or promote Admins or Super Admins). */
export const assignableRoles = (viewerRole: UserRole | undefined): readonly UserRole[] =>
  viewerRole === 'Super Admin'
    ? USER_ROLES
    : USER_ROLES.filter((role) => !PROTECTED_ROLES.includes(role));

/** True when this viewer may edit or re-role the account (same rule as the backend). */
export const canManageAccount = (viewerRole: UserRole | undefined, target: ManagedUser): boolean =>
  viewerRole === 'Super Admin' ||
  (viewerRole === 'Admin' && !PROTECTED_ROLES.includes(target.role));

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

export type SubscriptionState = 'active' | 'expired' | 'inactive';

export const getSubscriptionState = (user: ManagedUser, now = Date.now()): SubscriptionState => {
  const endDate = user.activeSubscription?.endDate;
  if (!endDate) return 'inactive';
  return new Date(endDate).getTime() > now ? 'active' : 'expired';
};

export const SUBSCRIPTION_STATE_COLOR: Record<
  SubscriptionState,
  'success' | 'warning' | 'default'
> = { active: 'success', expired: 'warning', inactive: 'default' };

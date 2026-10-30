import type { ActiveSubscription } from '@/schemas/profile.schema';
import type { UserRole } from '@/types';

export interface CurrentPlan {
  plan: string;
  startDate: string | null;
  endDate: string;
}

/** The user's plan while it runs (same check as the old client: end date still in the future). */
export const getCurrentPlan = (
  subscription: ActiveSubscription | null | undefined,
  now = Date.now(),
): CurrentPlan | null => {
  if (!subscription?.plan || !subscription.endDate) return null;
  if (new Date(subscription.endDate).getTime() <= now) return null;
  return {
    plan: subscription.plan,
    startDate: subscription.startDate ?? null,
    endDate: subscription.endDate,
  };
};

/** Avatar colour per role (same as the old profile page). */
export const ROLE_COLORS: Record<UserRole, string> = {
  'Super Admin': '#7c3aed',
  Admin: '#1565c0',
  Moderator: '#0f766e',
  Teacher: '#d97706',
  Student: '#16a34a',
};

/** i18n key suffix of the role description / permission text. */
export const roleTextKey = (role: UserRole): 'student' | 'teacher' | 'moderator' | 'admin' => {
  if (role === 'Student') return 'student';
  if (role === 'Teacher') return 'teacher';
  if (role === 'Moderator') return 'moderator';
  return 'admin';
};

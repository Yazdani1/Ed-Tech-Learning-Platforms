import type { CommunityReactionType, ICommunityBadge, IUser, UserRole } from '../../types/index';

export const reactionOptions: Array<{ type: CommunityReactionType; icon: string }> = [
  { type: 'Like', icon: '👍' },
  { type: 'Love', icon: '❤️' },
  { type: 'Wow', icon: '😮' },
  { type: 'Sad', icon: '😢' },
  { type: 'Angry', icon: '😠' },
  { type: 'Helpful', icon: '💡' },
];

export const adminRoles: UserRole[] = ['Super Admin', 'Admin'];
export const moderationRoles: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];

export const isAdminRole = (role?: UserRole) => Boolean(role && adminRoles.includes(role));
export const canModerateRole = (role?: UserRole) => Boolean(role && moderationRoles.includes(role));

export const getUserBadges = (
  user: Pick<IUser, 'communityPoints'> | null | undefined,
  badges: ICommunityBadge[]
) => badges.filter((badge) => !badge.isArchived && (user?.communityPoints ?? 0) >= badge.requiredPoints);

export const formatCount = (value: number) => (value > 99 ? '99+' : String(value));

export const isRichTextEmpty = (value: string) =>
  value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim().length === 0;

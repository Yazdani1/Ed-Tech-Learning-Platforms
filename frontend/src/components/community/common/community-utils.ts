import {
  REACTION_TYPES,
  type CommunityBadge,
  type Post,
  type Reaction,
  type ReactionType,
} from '@/schemas/community.schema';
import { withAuthPanel } from '@/utils/auth-drawer';

/** Counts above this show as "99+" (as in the old page). */
const COUNT_CAP = 99;

export const formatCount = (value: number): string =>
  value > COUNT_CAP ? `${COUNT_CAP}+` : String(value);

/** Avatar letters and Cloudinary-only pictures: utils/user-display (shared with chat and group chat). */
export { nameInitial as initial, cloudinaryImage as safeImage } from '@/utils/user-display';

/** The badges a member has earned with these points. */
export const earnedBadges = (
  points: number | null | undefined,
  badges: CommunityBadge[],
): CommunityBadge[] =>
  badges.filter((badge) => !badge.isArchived && (points ?? 0) >= badge.requiredPoints);

/** A post's pictures (older posts have only `imageUrl`). */
export const postImages = (post: Post): { url: string }[] => {
  const images = post.images.filter((image) => image.url);
  if (images.length > 0) return images;
  return post.imageUrl ? [{ url: post.imageUrl }] : [];
};

export const REACTION_ICONS: Record<ReactionType, string> = {
  Like: '👍',
  Love: '❤️',
  Wow: '😮',
  Sad: '😢',
  Angry: '😠',
  Helpful: '💡',
};

export const reactionUserId = (reaction: Reaction): string | undefined =>
  typeof reaction.user === 'string' ? reaction.user : reaction.user?._id;

/** Reaction types with their counts, most used first (only those used at least once). */
export const reactionSummary = (reactions: Reaction[]): { type: ReactionType; count: number }[] =>
  REACTION_TYPES.map((type) => ({
    type,
    count: reactions.filter((reaction) => reaction.type === type).length,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

export const communityPostHref = (postId: string): string =>
  `/community-hub/${encodeURIComponent(postId)}`;
export const communityProfileHref = (userId: string): string =>
  `/community-hub/users/${encodeURIComponent(userId)}`;
/** The sign-in panel on this page, coming back here after signing in. */
export const signInHref = (path: string): string => withAuthPanel(path, '', 'login', path);

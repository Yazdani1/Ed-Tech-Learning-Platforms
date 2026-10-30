import type { HeroPost, HeroVisibility } from '@/schemas/showcase.schema';

/** How a post's publish schedule reads on the card and in the details dialog. */
export type HeroSchedule =
  | { kind: 'changes'; visibility: HeroVisibility; date: string }
  | { kind: 'publishes'; date: string }
  | { kind: 'immediate' };

/** True when the post has a publish date still in the future. */
export const isScheduled = (post: HeroPost, now: number = Date.now()): boolean =>
  Boolean(post.publishAt && new Date(post.publishAt).getTime() > now);

/** Same rules as the old page: a pending visibility change, a publish date, or "immediately". */
export const describeSchedule = (post: HeroPost, now: number = Date.now()): HeroSchedule => {
  if (post.publishAt && post.scheduledVisibility && isScheduled(post, now)) {
    return { kind: 'changes', visibility: post.scheduledVisibility, date: post.publishAt };
  }
  if (post.publishAt) return { kind: 'publishes', date: post.publishAt };
  return { kind: 'immediate' };
};

/** Posts in slider order (position, then newest first), as the backend sorts them. */
export const sortPosts = (posts: HeroPost[]): HeroPost[] =>
  [...posts].sort(
    (a, b) =>
      a.order - b.order || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

/** The ids in a new order after moving one item from `from` to `to`. */
export const moveId = (ids: string[], from: number, to: number): string[] => {
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (moved !== undefined) next.splice(to, 0, moved);
  return next;
};

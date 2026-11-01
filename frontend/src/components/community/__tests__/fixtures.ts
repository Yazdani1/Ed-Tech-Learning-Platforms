import { http } from 'msw';

import { makeUser, ok } from '@/test/msw/handlers';
import {
  communityProfileSchema,
  overviewSchema,
  postDetailSchema,
  postSchema,
  replySchema,
  type Post,
  type Reply,
} from '@/schemas/community.schema';

import type { UserRole } from '@/types';

export const CHANNEL = { _id: 'ch1', name: 'General', slug: 'general' };
export const OTHER_CHANNEL = { _id: 'ch2', name: 'Physics', slug: 'physics' };
export const BADGE = { _id: 'b1', name: 'Helper', requiredPoints: 5 };

/** A populated author as the backend sends it (same ids as makeUser). */
export const authorOf = (role: UserRole, points = 0) => {
  const user = makeUser(role);
  return { _id: user._id, name: user.name, role, avatar: '', communityPoints: points };
};

export const makePost = (overrides: Partial<Record<keyof Post, unknown>> = {}): Post =>
  postSchema.parse({
    _id: 'p1',
    channel: CHANNEL,
    title: 'How do loops work?',
    description: '<p>I need help with <strong>loops</strong>.</p>',
    images: [],
    author: authorOf('Student', 6),
    reactions: [],
    isPinned: false,
    isArchived: false,
    createdAt: '2026-10-29T10:00:00.000Z',
    replies: [],
    ...overrides,
  });

export const makeReply = (overrides: Partial<Record<keyof Reply, unknown>> = {}): Reply =>
  replySchema.parse({
    _id: 'r1',
    body: '<p>Use a for loop.</p>',
    author: authorOf('Teacher'),
    images: [],
    reactions: [],
    isAccepted: false,
    createdAt: '2026-10-29T11:00:00.000Z',
    childReplies: [],
    childReplyCount: 0,
    ...overrides,
  });

const emptyWidgets = { mostAnsweredPosts: [], topContributors: [], onlineMembers: [] };

export const makeOverview = (posts: Post[], overrides: Record<string, unknown> = {}) =>
  overviewSchema.parse({
    channels: [CHANNEL, OTHER_CHANNEL],
    channelPostCounts: { ch1: posts.length },
    channelReplyCounts: {},
    settings: { title: 'Community Hub', description: 'Ask and answer.' },
    totalPostCount: posts.length,
    resultPostCount: posts.length,
    postPagination: { skip: 0, limit: 10, loaded: posts.length, hasMore: false },
    totalMemberCount: 42,
    totalReplyCount: 3,
    posts,
    badges: [BADGE],
    widgets: emptyWidgets,
    guestLimited: false,
    ...overrides,
  });

export const makeDetail = (post: Post, replies: Reply[], hasMore = false) =>
  postDetailSchema.parse({
    post: { ...post, replies, replyCount: replies.length },
    badges: [BADGE],
    channels: [CHANNEL],
    repliesPagination: { total: replies.length, limit: 10, skip: 0, hasMore },
  });

export const makePublicProfile = (role: UserRole, overrides: Record<string, unknown> = {}) =>
  communityProfileSchema.parse({
    isPrivate: false,
    user: {
      ...authorOf(role, 12),
      createdAt: '2026-01-01T00:00:00.000Z',
      isCommunityProfilePrivate: false,
    },
    stats: { discussionsAsked: 2, answersGiven: 3, reactionsReceived: 4, reactionsGiven: 5 },
    badges: [BADGE],
    discussions: [makePost()],
    answers: [
      {
        _id: 'a1',
        body: '<p>My answer text</p>',
        createdAt: '2026-10-29T11:00:00.000Z',
        post: { _id: 'p1', title: 'How do loops work?' },
      },
    ],
    ...overrides,
  });

/** GET /api/community answering with this overview (any query). */
export const overviewHandler = (data: unknown) => http.get('*/api/community', () => ok(data));

import { z } from 'zod';

import { hasVisibleText } from '@/utils/html-text';

// Community Hub (GET/POST/PUT/PATCH /api/community/...). Shapes match community.controller.ts.

export const REACTION_TYPES = ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful'] as const;
export const reactionTypeSchema = z.enum(REACTION_TYPES);
export type ReactionType = z.infer<typeof reactionTypeSchema>;

/** Posts and replies take up to 8 images (types and size: utils/image-files). */
export const MAX_POST_IMAGES = 8;

/** A populated author (name, avatar, role, points only: the backend never sends more). Null when deleted. */
export const communityAuthorSchema = z.object({
  _id: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  role: z.string(),
  communityPoints: z.number().nullish(),
});
export type CommunityAuthor = z.infer<typeof communityAuthorSchema>;

const authorField = communityAuthorSchema.nullable().catch(null);

export const reactionSchema = z.object({
  user: z.union([communityAuthorSchema, z.string()]).nullable().catch(null),
  type: reactionTypeSchema,
});
export type Reaction = z.infer<typeof reactionSchema>;

export const channelSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullish(),
  imageUrl: z.string().nullish(),
  isArchived: z.boolean().optional(),
});
export type CommunityChannel = z.infer<typeof channelSchema>;

export const badgeSchema = z.object({
  _id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullish(),
  requiredPoints: z.number(),
  isArchived: z.boolean().optional(),
});
export type CommunityBadge = z.infer<typeof badgeSchema>;

const imageSchema = z.object({ url: z.string() });

export const childReplySchema = z.object({
  _id: z.string(),
  body: z.string(),
  author: authorField,
  createdAt: z.string(),
});
export type ChildReply = z.infer<typeof childReplySchema>;

export const replySchema = z.object({
  _id: z.string(),
  body: z.string(),
  author: authorField,
  images: z.array(imageSchema).catch([]),
  reactions: z.array(reactionSchema).catch([]),
  isAccepted: z.boolean().catch(false),
  createdAt: z.string(),
  childReplies: z.array(childReplySchema).optional(),
  childReplyCount: z.number().optional(),
});
export type Reply = z.infer<typeof replySchema>;

export const postSchema = z.object({
  _id: z.string(),
  channel: channelSchema.nullable().catch(null),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullish(),
  images: z.array(imageSchema).catch([]),
  author: authorField,
  reactions: z.array(reactionSchema).catch([]),
  isPinned: z.boolean().catch(false),
  isArchived: z.boolean().catch(false),
  createdAt: z.string(),
  replies: z.array(replySchema).catch([]),
  replyCount: z.number().optional(),
});
export type Post = z.infer<typeof postSchema>;

export const userStatsSchema = z.object({
  discussionsAsked: z.number(),
  answersGiven: z.number(),
  reactionsReceived: z.number(),
  reactionsGiven: z.number(),
});
export type UserStats = z.infer<typeof userStatsSchema>;

const memberSchema = communityAuthorSchema.extend({ createdAt: z.string().optional() });

export const widgetsSchema = z.object({
  mostAnsweredPosts: z.array(postSchema).catch([]),
  topContributors: z
    .array(z.object({ user: memberSchema, answerCount: z.number(), badges: z.array(badgeSchema) }))
    .catch([]),
  onlineMembers: z.array(z.object({ user: memberSchema })).catch([]),
});
export type HubWidgets = z.infer<typeof widgetsSchema>;

export const settingsSchema = z.object({
  title: z.string().catch(''),
  description: z.string().catch(''),
  headerImageUrl: z.string().nullish(),
});
export type CommunitySettings = z.infer<typeof settingsSchema>;

const countMap = z.record(z.string(), z.number()).catch({});

/** GET /api/community */
export const overviewSchema = z.object({
  channels: z.array(channelSchema),
  channelPostCounts: countMap,
  settings: settingsSchema.nullable().catch(null),
  totalPostCount: z.number(),
  resultPostCount: z.number(),
  postPagination: z.object({ skip: z.number(), loaded: z.number(), hasMore: z.boolean() }),
  totalMemberCount: z.number(),
  totalReplyCount: z.number(),
  posts: z.array(postSchema),
  badges: z.array(badgeSchema),
  widgets: widgetsSchema,
  guestLimited: z.boolean(),
});
export type CommunityOverview = z.infer<typeof overviewSchema>;

/** GET /api/community/posts/:postId */
export const postDetailSchema = z.object({
  post: postSchema,
  badges: z.array(badgeSchema),
  channels: z.array(channelSchema),
  repliesPagination: z.object({ total: z.number(), hasMore: z.boolean() }),
});
export type PostDetail = z.infer<typeof postDetailSchema>;

/** GET /api/community/posts/:postId/replies */
export const repliesPageSchema = z.object({
  replies: z.array(replySchema),
  total: z.number(),
  hasMore: z.boolean(),
});
export type RepliesPage = z.infer<typeof repliesPageSchema>;

const postRefSchema = z.object({ _id: z.string(), title: z.string() });

/** An answer (reply, with `post`) or a child reply (with `reply.post`) on a member's profile. */
export const profileAnswerSchema = z.object({
  _id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  post: z.union([postRefSchema, z.string()]).nullish().catch(null),
  reply: z
    .object({ post: postRefSchema.nullish().catch(null) })
    .nullish()
    .catch(null),
});
export type ProfileAnswer = z.infer<typeof profileAnswerSchema>;

const privateProfileSchema = z.object({
  isPrivate: z.literal(true),
  user: communityAuthorSchema.pick({ _id: true, name: true, avatar: true, role: true }),
});

const publicProfileSchema = z.object({
  isPrivate: z.literal(false),
  user: memberSchema.extend({ isCommunityProfilePrivate: z.boolean().catch(false) }),
  stats: userStatsSchema,
  badges: z.array(badgeSchema),
  discussions: z.array(postSchema),
  answers: z.array(profileAnswerSchema),
});
export type PublicCommunityProfile = z.infer<typeof publicProfileSchema>;

/** GET /api/community/users/:userId (a private profile shows only name, avatar and role). */
export const communityProfileSchema = z.discriminatedUnion('isPrivate', [
  privateProfileSchema,
  publicProfileSchema,
]);
export type CommunityProfile = z.infer<typeof communityProfileSchema>;

export const POINT_RULE_KEYS = [
  'acceptedAnswer',
  'createPost',
  'createReply',
  'receiveReaction',
] as const;
export const pointRuleSchema = z.object({
  _id: z.string().optional(),
  key: z.enum(POINT_RULE_KEYS),
  label: z.string(),
  points: z.number(),
});
export type PointRule = z.infer<typeof pointRuleSchema>;

// ---- Forms (messages are i18n keys) ----

const requiredText = z.string().trim().min(1, 'validation.required');
const richText = z.string().refine(hasVisibleText, 'validation.required');

export const postFormSchema = z.object({
  channel: z.string().min(1, 'validation.required'),
  title: requiredText,
  description: richText,
});
export type PostForm = z.infer<typeof postFormSchema>;

export const replyFormSchema = z.object({ body: richText });
export type ReplyForm = z.infer<typeof replyFormSchema>;

export const settingsFormSchema = z.object({ title: requiredText, description: z.string() });
export type SettingsForm = z.infer<typeof settingsFormSchema>;

export const channelFormSchema = z.object({ name: requiredText, description: z.string() });
export type ChannelForm = z.infer<typeof channelFormSchema>;

const pointsField = z.string().trim().regex(/^\d+$/, 'community.admin.pointsInvalid');

export const badgeFormSchema = z.object({ name: requiredText, requiredPoints: pointsField });
export type BadgeForm = z.infer<typeof badgeFormSchema>;

export const pointRulesFormSchema = z.object({
  rules: z.array(
    z.object({ key: z.enum(POINT_RULE_KEYS), label: z.string(), points: pointsField }),
  ),
});
export type PointRulesForm = z.infer<typeof pointRulesFormSchema>;

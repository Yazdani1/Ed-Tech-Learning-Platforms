import { z } from 'zod';

// Shapes of /api/group-chat/* and the groupChat:* socket events (backend groupChat.controller.ts).

export const CHANNEL_NAME_MAX = 120;
export const CHANNEL_DESCRIPTION_MAX = 2000;

/** A populated user (members.user, joinRequests.user, creator): name, avatar and platform role. */
const personSchema = z.object({
  _id: z.string(),
  name: z.string().default(''),
  avatar: z.string().optional(),
  role: z.string().default(''),
});
export type ChannelPerson = z.infer<typeof personSchema>;

/**
 * Some responses are not populated (e.g. "Already a member"), so a reference may be a plain id; a deleted
 * user populates as null.
 */
const personRefSchema = z
  .union([
    personSchema,
    z.string().transform((id): ChannelPerson => ({ _id: id, name: '', role: '' })),
  ])
  .nullable();

export const channelTypeSchema = z.enum(['Public', 'Private']);
export type ChannelType = z.infer<typeof channelTypeSchema>;

const memberSchema = z.object({
  user: personRefSchema,
  role: z.enum(['Admin', 'Member']),
  unreadCount: z.number().default(0),
});

const joinRequestSchema = z.object({
  user: personRefSchema,
  status: z.enum(['Pending', 'Approved', 'Rejected']),
});

export interface ChannelMember {
  user: ChannelPerson;
  role: 'Admin' | 'Member';
  unreadCount: number;
}

export interface ChannelJoinRequest {
  user: ChannelPerson;
  status: 'Pending' | 'Approved' | 'Rejected';
}

const withUser = <T extends { user: ChannelPerson | null }>(
  item: T,
): item is T & { user: ChannelPerson } => item.user !== null;

/** A channel as members and platform staff see it (members and join requests included). */
export const channelSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    description: z.string().default(''),
    type: channelTypeSchema,
    creator: personRefSchema,
    members: z.array(memberSchema),
    joinRequests: z.array(joinRequestSchema).default([]),
    lastMessage: z.string().default(''),
    lastMessageAt: z.string().optional(),
    isBlocked: z.boolean().default(false),
    isArchived: z.boolean().default(false),
  })
  .transform((channel) => ({
    ...channel,
    kind: 'full' as const,
    creatorId: channel.creator?._id ?? null,
    members: channel.members.filter(withUser),
    joinRequests: channel.joinRequests.filter(withUser),
  }));
export type Channel = z.infer<typeof channelSchema>;

/** The public card a non-member sees in Discover: never the members or other users' requests. */
export const channelCardSchema = z
  .object({
    _id: z.string(),
    name: z.string(),
    description: z.string().default(''),
    type: channelTypeSchema,
    memberCount: z.number(),
    hasPendingRequest: z.boolean().default(false),
    lastMessageAt: z.string().optional(),
  })
  .transform((card) => ({ ...card, kind: 'card' as const }));
export type ChannelCard = z.infer<typeof channelCardSchema>;

/** Discover and join/cancel responses: the full channel for members, the public card otherwise. */
export const channelOrCardSchema = z.union([channelSchema, channelCardSchema]);
export type ChannelOrCard = Channel | ChannelCard;

export const attachmentSchema = z.object({
  url: z.string(),
  publicId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  resourceType: z.string().default('raw'),
});
export type ChatAttachment = z.infer<typeof attachmentSchema>;

export const groupMessageSchema = z.object({
  _id: z.string(),
  channel: z.string(),
  sender: z.string(),
  senderName: z.string(),
  senderRole: z.string(),
  senderAvatar: z.string().default(''),
  content: z.string().default(''),
  attachments: z.array(attachmentSchema).default([]),
  createdAt: z.string(),
});
export type GroupMessage = z.infer<typeof groupMessageSchema>;

/** groupChat:typing event from the server. */
export const typingEventSchema = z.object({
  channelId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  isTyping: z.boolean(),
});
export type TypingEvent = z.infer<typeof typingEventSchema>;

/** GET /api/group-chat/users/search: email only for platform staff. */
export const searchUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  role: z.string(),
  email: z.string().optional(),
});
export type SearchUser = z.infer<typeof searchUserSchema>;

/** Create / edit channel form (POST and PATCH body). */
export const channelFormSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(CHANNEL_NAME_MAX),
  description: z.string().trim().max(CHANNEL_DESCRIPTION_MAX),
  type: channelTypeSchema,
});
export type ChannelFormValues = z.infer<typeof channelFormSchema>;

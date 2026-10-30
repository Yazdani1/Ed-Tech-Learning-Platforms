// Extra factories for the community hub and group chat tests.
import {
  CommunityAnswerReply,
  type ICommunityAnswerReply,
} from '../../src/models/CommunityAnswerReply.model';
import { CommunityBadge, type ICommunityBadge } from '../../src/models/CommunityBadge.model';
import { CommunityChannel, type ICommunityChannel } from '../../src/models/CommunityChannel.model';
import { CommunityPost, type ICommunityPost } from '../../src/models/CommunityPost.model';
import { CommunityReply, type ICommunityReply } from '../../src/models/CommunityReply.model';
import { GroupChatChannel, type IGroupChatChannel } from '../../src/models/GroupChatChannel.model';
import { User, type IUser } from '../../src/models/User.model';
import { createUser, nextId } from './index';

export const createCommunityChannel = async (
  overrides: Partial<ICommunityChannel> = {},
): Promise<ICommunityChannel> => {
  const n = nextId();
  const createdBy = overrides.createdBy ?? (await createUser('Admin'))._id;
  return CommunityChannel.create({
    name: `Hub channel ${n}`,
    slug: `hub-channel-${n}`,
    ...overrides,
    createdBy,
  });
};

export const createCommunityPost = async (
  author: IUser,
  overrides: Partial<ICommunityPost> = {},
): Promise<ICommunityPost> => {
  const n = nextId();
  const channel = overrides.channel ?? (await createCommunityChannel())._id;
  return CommunityPost.create({
    title: `Post ${n}`,
    description: `Description ${n}`,
    ...overrides,
    channel,
    author: author._id,
  });
};

export const createCommunityReply = async (
  author: IUser,
  postId: ICommunityReply['post'],
  overrides: Partial<ICommunityReply> = {},
): Promise<ICommunityReply> =>
  CommunityReply.create({
    body: `Reply ${nextId()}`,
    ...overrides,
    post: postId,
    author: author._id,
  });

export const createCommunityAnswerReply = async (
  author: IUser,
  replyId: ICommunityAnswerReply['reply'],
  overrides: Partial<ICommunityAnswerReply> = {},
): Promise<ICommunityAnswerReply> =>
  CommunityAnswerReply.create({
    body: `Child ${nextId()}`,
    ...overrides,
    reply: replyId,
    author: author._id,
  });

export const createCommunityBadge = async (
  createdBy: IUser,
  overrides: Partial<ICommunityBadge> = {},
): Promise<ICommunityBadge> =>
  CommunityBadge.create({
    name: `Badge ${nextId()}`,
    requiredPoints: 10,
    ...overrides,
    createdBy: createdBy._id,
  });

export const pointsOf = async (user: IUser): Promise<number> =>
  (await User.findById(user._id).lean())?.communityPoints ?? 0;

/** A group chat channel; `members` are users added as plain members, the creator is the channel admin. */
export const createGroupChannel = async (
  creator: IUser,
  members: IUser[] = [],
  overrides: Partial<IGroupChatChannel> = {},
): Promise<IGroupChatChannel> =>
  GroupChatChannel.create({
    name: `Group ${nextId()}`,
    description: 'A group',
    type: 'Public',
    ...overrides,
    creator: creator._id,
    members: [
      { user: creator._id, role: 'Admin', unreadCount: 0 },
      ...members.map((user) => ({ user: user._id, role: 'Member' as const, unreadCount: 0 })),
    ],
  });

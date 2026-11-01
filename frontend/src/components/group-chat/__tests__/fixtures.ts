import { http, type RequestHandler } from 'msw';

import { makeUser, ok } from '@/test/msw/handlers';

/** Raw backend shapes (before the app's Zod transforms), for MSW handlers and socket payloads. */
export const STUDENT = makeUser('Student');
export const ADMIN = makeUser('Admin');
export const OTHER = { _id: '64b7f0c2a1b2c3d4e5f6a999', name: 'Rahim Uddin', role: 'Student' };

const person = (user: { _id: string; name: string; role: string }) => ({
  _id: user._id,
  name: user.name,
  role: user.role,
  avatar: '',
});

interface RawChannelOptions {
  id: string;
  name: string;
  type?: 'Public' | 'Private';
  creator?: { _id: string; name: string; role: string };
  members?: {
    user: { _id: string; name: string; role: string };
    role: 'Admin' | 'Member';
    unreadCount?: number;
  }[];
  requests?: { _id: string; name: string; role: string }[];
  isBlocked?: boolean;
  lastMessageAt?: string;
}

export const rawChannel = ({
  id,
  name,
  type = 'Public',
  creator = OTHER,
  members = [{ user: OTHER, role: 'Admin' }],
  requests = [],
  isBlocked = false,
  lastMessageAt = '2026-10-30T10:00:00.000Z',
}: RawChannelOptions) => ({
  _id: id,
  name,
  description: `${name} description`,
  type,
  creator: person(creator),
  members: members.map((member) => ({
    user: person(member.user),
    role: member.role,
    unreadCount: member.unreadCount ?? 0,
    joinedAt: '2026-10-01T10:00:00.000Z',
  })),
  joinRequests: requests.map((user) => ({
    user: person(user),
    status: 'Pending',
    requestedAt: '2026-10-02T10:00:00.000Z',
  })),
  lastMessage: '',
  lastMessageAt,
  isBlocked,
  isArchived: false,
});

export const rawCard = (
  id: string,
  name: string,
  type: 'Public' | 'Private',
  hasPendingRequest = false,
) => ({
  _id: id,
  name,
  description: `${name} description`,
  type,
  memberCount: 3,
  hasPendingRequest,
  lastMessageAt: '2026-10-29T10:00:00.000Z',
});

export const rawMessage = (
  id: string,
  channel: string,
  sender: { _id: string; name: string; role: string },
  content: string,
  attachments: unknown[] = [],
) => ({
  _id: id,
  channel,
  sender: sender._id,
  senderName: sender.name,
  senderRole: sender.role,
  senderAvatar: '',
  content,
  attachments,
  createdAt: '2026-10-30T10:05:00.000Z',
});

export const CHANNEL_ID = '64b7f0c2a1b2c3d4e5f6c001';
export const CARD_ID = '64b7f0c2a1b2c3d4e5f6c002';

/** A channel the student belongs to (created by someone else) with 2 unread messages. */
export const studyGroup = (extra: Partial<RawChannelOptions> = {}) =>
  rawChannel({
    id: CHANNEL_ID,
    name: 'Physics Study Group',
    members: [
      { user: OTHER, role: 'Admin' },
      { user: STUDENT, role: 'Member', unreadCount: 2 },
    ],
    ...extra,
  });

/** Read handlers: my channels, discover and messages. */
export const readHandlers = (
  channels: unknown[],
  discover: unknown[] = [],
  messages: unknown[] = [],
): RequestHandler[] => [
  http.get('*/api/group-chat/channels', () => ok(channels)),
  http.get('*/api/group-chat/channels/discover', () => ok(discover)),
  http.get('*/api/group-chat/channels/:id/messages', () => ok(messages)),
  http.patch('*/api/group-chat/channels/:id/read', () => ok(undefined)),
];

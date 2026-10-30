// Extra factories for the dashboard, performance, chat, notification, hero post and schedule tests.
import type { Types } from 'mongoose';

import { ChatConversation } from '../../src/models/ChatConversation.model';
import { ChatMessage } from '../../src/models/ChatMessage.model';
import { HomeHeroPost } from '../../src/models/HomeHeroPost.model';
import { Notification, type NotificationPriority } from '../../src/models/Notification.model';
import { StudySchedule } from '../../src/models/StudySchedule.model';
import { nextId } from './index';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);
export const daysFromNow = (days: number): Date => new Date(Date.now() + days * DAY_MS);

/** Same key the dashboard/performance code builds for a day bucket (server local time). */
export const dayKey = (date: Date): string => `${date.getMonth() + 1}/${date.getDate()}`;

export const createConversation = async (student: IUser, overrides: Record<string, unknown> = {}) =>
  ChatConversation.create({ student: student._id, ...overrides });

export const createChatMessage = async (
  conversationId: Types.ObjectId,
  sender: IUser,
  content: string,
  createdAt?: Date,
) =>
  ChatMessage.create({
    conversationId,
    senderId: sender._id,
    senderName: sender.name,
    senderRole: sender.role,
    content,
    ...(createdAt ? { createdAt } : {}),
  });

export const createNotificationDoc = async (
  sentBy: IUser,
  recipients: IUser[],
  overrides: {
    title?: string;
    priority?: NotificationPriority;
    targetRoles?: UserRole[];
    readBy?: IUser[];
    createdAt?: Date;
  } = {},
) => {
  const n = nextId();
  const readIds = new Set((overrides.readBy ?? []).map((user) => String(user._id)));
  return Notification.create({
    title: overrides.title ?? `Notice ${n}`,
    message: `Message ${n}`,
    priority: overrides.priority ?? 'Normal',
    targetRoles: overrides.targetRoles ?? ['Student'],
    sentBy: sentBy._id,
    recipients: recipients.map((user) => ({
      user: user._id,
      ...(readIds.has(String(user._id)) ? { readAt: new Date() } : {}),
    })),
    ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
  });
};

export const createHeroPost = async (admin: IUser, overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  return HomeHeroPost.create({
    imageUrl: `https://res.cloudinary.com/test-cloud/hero/${n}.png`,
    imagePublicId: `hero/${n}`,
    visibility: 'Public',
    order: 0,
    createdBy: admin._id,
    ...overrides,
  });
};

export const createTimerDoc = async (user: IUser, overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  return StudySchedule.create({
    user: user._id,
    type: 'timer',
    title: `Timer ${n}`,
    duration: 600,
    status: 'active',
    ...overrides,
  });
};

export const createReminderDoc = async (user: IUser, overrides: Record<string, unknown> = {}) => {
  const n = nextId();
  return StudySchedule.create({
    user: user._id,
    type: 'reminder',
    title: `Reminder ${n}`,
    startDateTime: daysFromNow(1),
    status: 'pending',
    ...overrides,
  });
};

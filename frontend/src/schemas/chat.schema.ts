import { z } from 'zod';

// Support chat shapes: what GET /api/chat/... and the Socket.io `chat:*` events really send.

/** Same limit the backend enforces on `chat:send` (longer messages get a `chat:error`). */
export const MAX_CHAT_MESSAGE_LENGTH = 2000;

/** The student of a conversation (teachers get no email; a deleted account comes back as null). */
export const chatStudentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  avatar: z.string().nullish(),
  email: z.string().optional(),
});
export type ChatStudent = z.infer<typeof chatStudentSchema>;

/** GET /api/chat/conversations (staff: an array; student: their own one) and `chat:conversationUpdated`. */
export const chatConversationSchema = z.object({
  _id: z.string(),
  student: chatStudentSchema.nullish(),
  unreadByStaff: z.number().default(0),
  unreadByStudent: z.number().default(0),
  lastMessage: z.string().default(''),
  lastMessageAt: z.string().nullish(),
});
export type ChatConversation = z.infer<typeof chatConversationSchema>;

/** GET /api/chat/conversations/:id/messages items and the `chat:message` event. */
export const chatMessageSchema = z.object({
  _id: z.string(),
  conversationId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderRole: z.string(),
  senderAvatar: z.string().nullish(),
  content: z.string(),
  createdAt: z.string(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** `chat:typing` */
export const chatTypingSchema = z.object({
  conversationId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.string(),
  isTyping: z.boolean(),
});
export type ChatTyping = z.infer<typeof chatTypingSchema>;

/** `chat:presence` (staff only): a student came online or went offline. */
export const chatPresenceSchema = z.object({ studentId: z.string(), isOnline: z.boolean() });

/** `chat:presenceSnapshot` (staff only, on connect): the ids of the students online now. */
export const chatPresenceSnapshotSchema = z.array(z.string());

/** `chat:error`: the backend's English message. */
export const chatErrorSchema = z.string();

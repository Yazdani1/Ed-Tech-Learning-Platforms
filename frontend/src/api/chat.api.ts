'use client';

import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { z } from 'zod';

import {
  chatConversationSchema,
  chatMessageSchema,
  type ChatConversation,
  type ChatMessage,
} from '@/schemas/chat.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

// Support chat. Reads are REST; sending, typing and "mark read" go over the socket (components/chat), and
// live events are written into these cache entries with the helpers at the bottom.

const id = (value: string): string => encodeURIComponent(value);

/** Staff (Super Admin, Admin, Moderator, Teacher): every conversation, most recent first. */
export const getStaffConversations = (): Promise<ChatConversation[]> =>
  http.get('/api/chat/conversations', z.array(chatConversationSchema));

/** Student: their own conversation (the backend creates it on first use). */
export const getMyConversation = (): Promise<ChatConversation> =>
  http.get('/api/chat/conversations', chatConversationSchema);

export const getChatMessages = (conversationId: string): Promise<ChatMessage[]> =>
  http.get(`/api/chat/conversations/${id(conversationId)}/messages`, z.array(chatMessageSchema));

export const useStaffConversations = (
  enabled = true,
): UseQueryResult<ChatConversation[], ApiError> =>
  useQuery({
    queryKey: queryKeys.chat.staffConversations,
    queryFn: getStaffConversations,
    enabled,
  });

export const useMyConversation = (enabled = true): UseQueryResult<ChatConversation, ApiError> =>
  useQuery({ queryKey: queryKeys.chat.myConversation, queryFn: getMyConversation, enabled });

export const useChatMessages = (
  conversationId: string | undefined,
): UseQueryResult<ChatMessage[], ApiError> =>
  useQuery({
    queryKey: queryKeys.chat.messages(conversationId ?? ''),
    queryFn: () => getChatMessages(conversationId ?? ''),
    enabled: Boolean(conversationId),
  });

const NO_ONE_ONLINE: string[] = [];

/** Staff: the students online now. Never fetched: the socket fills it (see useChatLiveSync). */
export const useOnlineStudentIds = (): string[] => {
  const { data } = useQuery({
    queryKey: queryKeys.chat.presence,
    queryFn: () => NO_ONE_ONLINE,
    initialData: NO_ONE_ONLINE,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data;
};

// ---- Cache updates from live events ----

const byLatestActivity = (a: ChatConversation, b: ChatConversation): number =>
  new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime();

/**
 * Live updates carry no student email (the staff room includes teachers), so the student fields already
 * in the list (the email admins search by) are kept and only the sent ones are replaced.
 */
const mergeConversation = (
  previous: ChatConversation | undefined,
  next: ChatConversation,
): ChatConversation => {
  const before = previous?.student;
  const after = next.student;
  if (!before || before._id !== after?._id) return next;
  return { ...next, student: { ...before, ...after } };
};

/** Puts a changed conversation into the staff list (adds it when new) and keeps the list sorted. */
export const upsertStaffConversation = (
  client: QueryClient,
  conversation: ChatConversation,
): void => {
  client.setQueryData<ChatConversation[]>(queryKeys.chat.staffConversations, (list) => {
    if (!list) return list;
    const previous = list.find((item) => item._id === conversation._id);
    const others = list.filter((item) => item._id !== conversation._id);
    return [mergeConversation(previous, conversation), ...others].sort(byLatestActivity);
  });
};

/** Staff: sets one conversation's unread count (0 when it is opened) without waiting for the server. */
export const setStaffUnread = (
  client: QueryClient,
  conversationId: string,
  unread: number,
): void => {
  client.setQueryData<ChatConversation[]>(queryKeys.chat.staffConversations, (list) =>
    list?.map((item) => (item._id === conversationId ? { ...item, unreadByStaff: unread } : item)),
  );
};

/** Student: changes the unread count of their own conversation. */
export const updateMyUnread = (client: QueryClient, change: (unread: number) => number): void => {
  client.setQueryData<ChatConversation>(queryKeys.chat.myConversation, (conversation) =>
    conversation
      ? { ...conversation, unreadByStudent: change(conversation.unreadByStudent) }
      : conversation,
  );
};

/** Adds a live message to its conversation's loaded messages (once, even if it arrives twice). */
export const appendChatMessage = (client: QueryClient, message: ChatMessage): void => {
  client.setQueryData<ChatMessage[]>(queryKeys.chat.messages(message.conversationId), (list) =>
    !list || list.some((item) => item._id === message._id) ? list : [...list, message],
  );
};

export const setOnlineStudents = (
  client: QueryClient,
  change: (ids: string[]) => string[],
): void => {
  client.setQueryData<string[]>(queryKeys.chat.presence, (ids) => change(ids ?? NO_ONE_ONLINE));
};

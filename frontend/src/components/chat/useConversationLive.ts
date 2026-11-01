'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { setStaffUnread, updateMyUnread } from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket, useSocketEvent } from '@/hooks/useSocket';
import { chatMessageSchema, chatTypingSchema, type ChatTyping } from '@/schemas/chat.schema';

export interface ConversationLive {
  /** Who is typing in the conversation right now (null when nobody) */
  typing: ChatTyping | null;
  /** Marks the conversation read on the server and in the badge */
  markRead: () => void;
}

/**
 * For the conversation on screen: marks it read when it opens and whenever someone else writes, and
 * tells who is typing in it right now. Remount (key) per conversation.
 */
export const useConversationLive = (conversationId: string | undefined): ConversationLive => {
  const socket = useSocket();
  const client = useQueryClient();
  const { user } = useAuth();
  const myId = user?._id;
  const isStudent = user?.role === 'Student';
  const [typing, setTyping] = useState<ChatTyping | null>(null);

  const markRead = useCallback(() => {
    if (!conversationId) return;
    socket?.emit('chat:markRead', { conversationId });
    if (isStudent) updateMyUnread(client, () => 0);
    else setStaffUnread(client, conversationId, 0);
  }, [client, conversationId, isStudent, socket]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  const onMessage = useCallback(
    (payload: unknown) => {
      const parsed = chatMessageSchema.safeParse(payload);
      if (!parsed.success || parsed.data.conversationId !== conversationId) return;
      if (parsed.data.senderId === myId) return;
      setTyping(null);
      markRead();
    },
    [conversationId, markRead, myId],
  );

  const onTyping = useCallback(
    (payload: unknown) => {
      const parsed = chatTypingSchema.safeParse(payload);
      if (!parsed.success) return;
      const event = parsed.data;
      if (event.conversationId !== conversationId || event.userId === myId) return;
      setTyping(event.isTyping ? event : null);
    },
    [conversationId, myId],
  );

  useSocketEvent('chat:message', onMessage);
  useSocketEvent('chat:typing', onTyping);
  return { typing, markRead };
};

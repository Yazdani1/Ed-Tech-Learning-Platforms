'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { appendGroupMessage, applyChannelUpdate, useMarkChannelRead } from '@/api/group-chat.api';
import {
  channelSchema,
  groupMessageSchema,
  typingEventSchema,
  type TypingEvent,
} from '@/schemas/group-chat.schema';

import { useSocket, useSocketEvent } from './useSocket';

import type { User } from '@/schemas/auth.schema';

/** A typing notice disappears after this long if the "stopped typing" event never comes. */
const TYPING_TIMEOUT_MS = 5000;

interface GroupChatSocketOptions {
  /** The selected channel */
  channelId: string | null;
  /** The viewer may read it (member or platform staff) */
  canOpen: boolean;
  user: User | null;
}

export interface GroupChatSocket {
  /** Someone else typing in the open channel */
  typingUser: TypingEvent | null;
  /** Tells the channel whether I am typing */
  emitTyping: (isTyping: boolean) => void;
}

/** groupChat:typing of other people, cleared by their "stopped" event or after a timeout. */
const useTypingNotice = (userId: string | undefined): [TypingEvent | null, () => void] => {
  const [typing, setTyping] = useState<TypingEvent | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    setTyping(null);
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
    },
    [],
  );

  const onTyping = useCallback(
    (payload: unknown) => {
      const parsed = typingEventSchema.safeParse(payload);
      if (!parsed.success || parsed.data.userId === userId) return;
      clear();
      if (!parsed.data.isTyping) return;
      setTyping(parsed.data);
      timer.current = window.setTimeout(() => {
        setTyping(null);
      }, TYPING_TIMEOUT_MS);
    },
    [userId, clear],
  );
  useSocketEvent('groupChat:typing', onTyping);
  return [typing, clear];
};

/**
 * Live group chat over the shared socket: joins the open channel's room, marks it read, appends new
 * messages, keeps the channel lists up to date and shows who is typing.
 */
export const useGroupChatSocket = ({
  channelId,
  canOpen,
  user,
}: GroupChatSocketOptions): GroupChatSocket => {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const { mutate: markRead } = useMarkChannelRead();
  const userId = user?._id;
  const role = user?.role;
  const openId = canOpen ? channelId : null;
  const [typing, clearTyping] = useTypingNotice(userId);

  // Channels joined after the socket connected are not in its rooms yet; the server checks membership.
  useEffect(() => {
    if (socket && openId) socket.emit('groupChat:joinRoom', { channelId: openId });
  }, [socket, openId]);

  useEffect(() => {
    if (openId && userId) markRead({ channelId: openId, userId });
  }, [openId, userId, markRead]);

  const onMessage = useCallback(
    (payload: unknown) => {
      const parsed = groupMessageSchema.safeParse(payload);
      if (!parsed.success) return;
      appendGroupMessage(queryClient, parsed.data);
      if (parsed.data.channel === openId && userId && parsed.data.sender !== userId) {
        clearTyping();
        markRead({ channelId: parsed.data.channel, userId });
      }
    },
    [queryClient, openId, userId, markRead, clearTyping],
  );

  const onChannelUpdated = useCallback(
    (payload: unknown) => {
      const parsed = channelSchema.safeParse(payload);
      if (parsed.success && userId && role)
        applyChannelUpdate(queryClient, parsed.data, { userId, role });
    },
    [queryClient, userId, role],
  );

  useSocketEvent('groupChat:message', onMessage);
  useSocketEvent('groupChat:channelUpdated', onChannelUpdated);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (openId) socket?.emit('groupChat:typing', { channelId: openId, isTyping });
    },
    [socket, openId],
  );

  return {
    typingUser: typing && openId && typing.channelId === openId ? typing : null,
    emitTyping,
  };
};

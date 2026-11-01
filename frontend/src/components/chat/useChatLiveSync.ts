'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  appendChatMessage,
  setOnlineStudents,
  updateMyUnread,
  upsertStaffConversation,
} from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';
import { useSocketEvent } from '@/hooks/useSocket';
import {
  chatConversationSchema,
  chatErrorSchema,
  chatMessageSchema,
  chatPresenceSchema,
  chatPresenceSnapshotSchema,
  type ChatConversation,
} from '@/schemas/chat.schema';

import { isChatViewOpen } from './chat-view-registry';

const TOO_LONG_ERROR = 'Message is too long';

/** Teachers answer support chat but never see student emails (the REST list already leaves them out). */
const forViewer = (conversation: ChatConversation, isTeacher: boolean): ChatConversation => {
  if (!isTeacher || !conversation.student) return conversation;
  const { _id, name, avatar } = conversation.student;
  return { ...conversation, student: { _id, name, avatar } };
};

/**
 * Keeps the support chat cache live for the whole signed-in area (mounted once by the shell): new messages
 * join their conversation, the staff conversation list and presence follow the server, the student's
 * unread badge counts staff replies they have not seen, and send errors become a toast.
 */
export const useChatLiveSync = (): void => {
  const client = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStudent = user?.role === 'Student';
  const isTeacher = user?.role === 'Teacher';

  const onMessage = useCallback(
    (payload: unknown) => {
      const parsed = chatMessageSchema.safeParse(payload);
      if (!parsed.success) return;
      appendChatMessage(client, parsed.data);
      if (isStudent && parsed.data.senderRole !== 'Student' && !isChatViewOpen()) {
        updateMyUnread(client, (unread) => unread + 1);
      }
    },
    [client, isStudent],
  );

  const onConversationUpdated = useCallback(
    (payload: unknown) => {
      const parsed = chatConversationSchema.safeParse(payload);
      if (!parsed.success || isStudent) return;
      upsertStaffConversation(client, forViewer(parsed.data, isTeacher));
    },
    [client, isStudent, isTeacher],
  );

  const onPresenceSnapshot = useCallback(
    (payload: unknown) => {
      const parsed = chatPresenceSnapshotSchema.safeParse(payload);
      if (parsed.success) setOnlineStudents(client, () => parsed.data);
    },
    [client],
  );

  const onPresence = useCallback(
    (payload: unknown) => {
      const parsed = chatPresenceSchema.safeParse(payload);
      if (!parsed.success) return;
      const { studentId, isOnline } = parsed.data;
      setOnlineStudents(client, (ids) => {
        const others = ids.filter((item) => item !== studentId);
        return isOnline ? [...others, studentId] : others;
      });
    },
    [client],
  );

  const onError = useCallback(
    (payload: unknown) => {
      const parsed = chatErrorSchema.safeParse(payload);
      const tooLong = parsed.success && parsed.data === TOO_LONG_ERROR;
      toast.error(t(tooLong ? 'messaging.chat.tooLong' : 'messaging.chat.sendFailed'));
    },
    [t],
  );

  useSocketEvent('chat:message', onMessage);
  useSocketEvent('chat:conversationUpdated', onConversationUpdated);
  useSocketEvent('chat:presenceSnapshot', onPresenceSnapshot);
  useSocketEvent('chat:presence', onPresence);
  useSocketEvent('chat:error', onError);
};

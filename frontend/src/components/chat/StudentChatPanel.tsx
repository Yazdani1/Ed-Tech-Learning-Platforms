'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatMessages, useMyConversation } from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';

import { ChatComposer } from './ChatComposer';
import { useChatViewOpen } from './chat-view-registry';
import { ChatWelcome } from './ChatWelcome';
import { MessageList } from './MessageList';
import { MessageSearchField } from './MessageSearchField';
import { useChatComposer } from './useChatComposer';
import { useConversationLive } from './useConversationLive';

/** A student's own support conversation: search, messages (live), typing indicator and the message box. */
export const StudentChatPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const conversation = useMyConversation();
  const conversationId = conversation.data?._id;
  const messages = useChatMessages(conversationId);
  useChatViewOpen(true);
  const { typing, markRead } = useConversationLive(conversationId);
  const unread = conversation.data?.unreadByStudent ?? 0;
  // A count fetched while the chat is open (the server had not seen our "read" yet) is read too
  useEffect(() => {
    if (unread > 0) markRead();
  }, [unread, markRead]);
  const composer = useChatComposer(conversationId, false);

  return (
    <>
      <MessageSearchField value={search} onChange={setSearch} />
      <MessageList
        messages={messages.data}
        isLoading={conversation.isLoading || messages.isLoading}
        error={conversation.error ?? messages.error}
        onRetry={() => {
          void (conversation.error ? conversation.refetch() : messages.refetch());
        }}
        search={search}
        typing={typing}
        myId={user?._id}
        emptyState={<ChatWelcome />}
      />
      <ChatComposer composer={composer} placeholder={t('messaging.chat.placeholder')} />
    </>
  );
};

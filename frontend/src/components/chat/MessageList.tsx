'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { filterMessages, CHAT_SURFACE } from './chat.utils';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

import type { ChatMessage, ChatTyping } from '@/schemas/chat.schema';
import type { FC, ReactNode } from 'react';

interface MessageListProps {
  messages: ChatMessage[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  search: string;
  typing: ChatTyping | null;
  myId: string | undefined;
  /** Shown when the conversation has no messages yet */
  emptyState: ReactNode;
}

/** The scrolling message area: newest at the bottom (kept in view), search filter, typing indicator. */
export const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  search,
  typing,
  myId,
  emptyState,
}) => {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const visible = filterMessages(messages ?? [], search);
  const searching = search.trim() !== '';

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, typing]);

  const renderContent = (): ReactNode => {
    if (!messages || messages.length === 0) return emptyState;
    if (visible.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 8 }}>
          {t('messaging.chat.noMatch')}
        </Typography>
      );
    }
    return (
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {visible.map((message) => (
          <MessageBubble key={message._id} message={message} isMine={message.senderId === myId} />
        ))}
      </Box>
    );
  };

  return (
    <Box
      ref={scroller}
      role="log"
      aria-label={t('messaging.chat.messagesLabel')}
      sx={{ flex: 1, overflowY: 'auto', px: { xs: 1.5, sm: 3 }, py: 2.5, bgcolor: CHAT_SURFACE }}
    >
      <QueryState isLoading={isLoading} error={error} onRetry={onRetry}>
        {renderContent()}
      </QueryState>
      {typing && !searching && <TypingIndicator typing={typing} />}
    </Box>
  );
};

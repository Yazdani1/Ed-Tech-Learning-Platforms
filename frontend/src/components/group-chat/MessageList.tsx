'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { QueryState } from '@/components/common/QueryState';

import { GroupTypingIndicator } from './GroupTypingIndicator';
import { MessageBubble } from './MessageBubble';

import type { GroupMessage, TypingEvent } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface MessageListProps {
  messages: GroupMessage[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** Filters the loaded messages by text, sender name or role */
  search: string;
  userId: string | undefined;
  typingUser: TypingEvent | null;
}

/** The conversation, oldest first, scrolled to the newest message. */
export const MessageList: FC<MessageListProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  search,
  userId,
  typingUser,
}) => {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return messages;
    return messages.filter((message) =>
      [message.content, message.senderName, message.senderRole]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [messages, search]);

  useEffect(() => {
    const box = scroller.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [visible.length, typingUser]);

  return (
    <Box
      ref={scroller}
      role="log"
      aria-label={t('groupChat.messages.listLabel')}
      sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 3 }, bgcolor: '#f7f8fc' }}
    >
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        isEmpty={visible.length === 0 && !typingUser}
        emptyText={t('groupChat.messages.empty')}
      >
        <Stack spacing={1.5}>
          {visible.map((message) => (
            <MessageBubble key={message._id} message={message} mine={message.sender === userId} />
          ))}
          {typingUser && <GroupTypingIndicator typingUser={typingUser} />}
        </Stack>
      </QueryState>
    </Box>
  );
};

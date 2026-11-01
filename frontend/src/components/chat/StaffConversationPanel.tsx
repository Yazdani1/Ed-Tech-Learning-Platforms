'use client';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChatMessages, useOnlineStudentIds } from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';

import { ChatComposer } from './ChatComposer';
import { MessageList } from './MessageList';
import { MessageSearchField } from './MessageSearchField';
import { StaffChatHeader } from './StaffChatHeader';
import { useChatComposer } from './useChatComposer';
import { useConversationLive } from './useConversationLive';

import type { ChatConversation } from '@/schemas/chat.schema';
import type { FC } from 'react';

interface StaffConversationPanelProps {
  conversation: ChatConversation;
  onBack: () => void;
}

/** Staff: one student's conversation (header, search, live messages, typing, reply box). */
export const StaffConversationPanel: FC<StaffConversationPanelProps> = ({
  conversation,
  onBack,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const messages = useChatMessages(conversation._id);
  const online = useOnlineStudentIds();
  const { typing } = useConversationLive(conversation._id);
  const composer = useChatComposer(conversation._id, true);
  const student = conversation.student;
  const name = student?.name ?? t('messaging.chat.studentFallback');

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      <StaffChatHeader
        student={student}
        online={Boolean(student && online.includes(student._id))}
        showEmail={user?.role !== 'Teacher'}
        onBack={onBack}
      />
      <MessageSearchField value={search} onChange={setSearch} />
      <MessageList
        messages={messages.data}
        isLoading={messages.isLoading}
        error={messages.error}
        onRetry={() => void messages.refetch()}
        search={search}
        typing={typing}
        myId={user?._id}
        emptyState={
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <ForumOutlinedIcon sx={{ fontSize: 48, color: '#c7c5f0', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('messaging.chat.startConversation')}
            </Typography>
          </Box>
        }
      />
      <ChatComposer composer={composer} placeholder={t('messaging.chat.replyTo', { name })} />
    </Box>
  );
};

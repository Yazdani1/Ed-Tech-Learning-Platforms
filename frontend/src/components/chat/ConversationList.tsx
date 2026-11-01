'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOnlineStudentIds, useStaffConversations } from '@/api/chat.api';
import { QueryState } from '@/components/common/QueryState';

import { filterConversations } from './chat.utils';
import { ConversationListItem } from './ConversationListItem';
import { ChatInboxHeader } from './ChatInboxHeader';

import type { FC } from 'react';

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
}

/** Staff support inbox: heading, student search and the conversations (live). */
export const ConversationList: FC<ConversationListProps> = ({ selectedId, onSelect }) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const conversations = useStaffConversations();
  const online = useOnlineStudentIds();
  const visible = filterConversations(conversations.data ?? [], search);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <ChatInboxHeader search={search} onSearchChange={setSearch} />
      <Box sx={{ flex: 1, overflowY: 'auto', p: conversations.isLoading ? 2 : 0 }}>
        <QueryState
          isLoading={conversations.isLoading}
          error={conversations.error}
          onRetry={() => void conversations.refetch()}
          isEmpty={visible.length === 0}
          emptyText={t('messaging.chat.noConversations')}
        >
          <List disablePadding aria-label={t('messaging.chat.conversations')}>
            {visible.map((conversation) => (
              <ConversationListItem
                key={conversation._id}
                conversation={conversation}
                selected={conversation._id === selectedId}
                online={Boolean(conversation.student && online.includes(conversation.student._id))}
                onSelect={() => {
                  onSelect(conversation._id);
                }}
              />
            ))}
          </List>
        </QueryState>
      </Box>
    </Box>
  );
};

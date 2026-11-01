'use client';

import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChannelMessages } from '@/api/group-chat.api';

import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';

import type { TypingEvent } from '@/schemas/group-chat.schema';
import type { FC } from 'react';

interface ChannelConversationProps {
  channelId: string;
  userId: string | undefined;
  typingUser: TypingEvent | null;
  onTyping: (isTyping: boolean) => void;
}

/** Message search, the messages and the composer of a channel the viewer may read. */
export const ChannelConversation: FC<ChannelConversationProps> = ({
  channelId,
  userId,
  typingUser,
  onTyping,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const messages = useChannelMessages(channelId, true);

  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1.25,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder={t('groupChat.messages.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          slotProps={{
            htmlInput: { 'aria-label': t('groupChat.messages.searchLabel') },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
        />
      </Box>
      <MessageList
        messages={messages.data ?? []}
        isLoading={messages.isPending}
        error={messages.error}
        onRetry={() => void messages.refetch()}
        search={search}
        userId={userId}
        typingUser={typingUser}
      />
      <MessageComposer channelId={channelId} onTyping={onTyping} />
    </>
  );
};

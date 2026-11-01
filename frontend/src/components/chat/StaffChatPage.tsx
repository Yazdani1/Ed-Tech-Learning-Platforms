'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useState } from 'react';

import { useStaffConversations } from '@/api/chat.api';

import { CHAT_BORDER, CHAT_SCREEN_HEIGHT, CHAT_SCREEN_MIN_HEIGHT } from './chat.utils';
import { ConversationList } from './ConversationList';
import { NoConversationSelected } from './NoConversationSelected';
import { StaffConversationPanel } from './StaffConversationPanel';

const LIST_WIDTH = 300;

/**
 * /admin/chat and /teacher/chat: the support inbox. Wide screens show the list and the open conversation
 * side by side; phones and tablets show one at a time (a back button returns to the list).
 */
export const StaffChatPage = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const conversations = useStaffConversations();
  const selected = conversations.data?.find((item) => item._id === selectedId);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        height: CHAT_SCREEN_HEIGHT,
        minHeight: CHAT_SCREEN_MIN_HEIGHT,
        overflow: 'hidden',
        border: 1,
        borderColor: CHAT_BORDER,
        bgcolor: '#f5f4ff',
      }}
    >
      <Box
        sx={{
          width: { xs: '100%', md: LIST_WIDTH },
          flexShrink: 0,
          display: { xs: selected ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
          bgcolor: '#fff',
          borderRight: { md: 1 },
          borderColor: { md: CHAT_BORDER },
        }}
      >
        <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
      </Box>
      {selected ? (
        <StaffConversationPanel
          key={selected._id}
          conversation={selected}
          onBack={() => {
            setSelectedId(null);
          }}
        />
      ) : (
        <NoConversationSelected />
      )}
    </Paper>
  );
};

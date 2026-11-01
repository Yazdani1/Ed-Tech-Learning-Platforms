'use client';

import Paper from '@mui/material/Paper';

import { CHAT_SCREEN_HEIGHT, CHAT_SCREEN_MIN_HEIGHT } from './chat.utils';
import { StudentChatHeader } from './StudentChatHeader';
import { StudentChatPanel } from './StudentChatPanel';

/** /student/chat: the student's support conversation filling the page. */
export const StudentChatPage = () => (
  <Paper
    elevation={0}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: CHAT_SCREEN_HEIGHT,
      minHeight: CHAT_SCREEN_MIN_HEIGHT,
      overflow: 'hidden',
      border: 1,
      borderColor: 'rgba(99,102,241,0.15)',
      boxShadow: '0 4px 24px rgba(99,102,241,0.1)',
    }}
  >
    <StudentChatHeader headingComponent="h1" />
    <StudentChatPanel />
  </Paper>
);

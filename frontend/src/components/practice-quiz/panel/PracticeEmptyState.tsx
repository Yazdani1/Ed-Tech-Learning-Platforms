'use client';

import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { PracticeSignInHint } from './PracticeSignInHint';

import type { FC } from 'react';

interface PracticeEmptyStateProps {
  text: string;
  showSignInHint: boolean;
}

/** No bank chosen yet: a large quiz icon, what to do next and (guests) the sign-in hint. */
export const PracticeEmptyState: FC<PracticeEmptyStateProps> = ({ text, showSignInHint }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      p: 4,
      textAlign: 'center',
      color: 'text.secondary',
    }}
  >
    <QuizOutlinedIcon sx={{ fontSize: 84, opacity: 0.15 }} aria-hidden />
    <Typography variant="h6" sx={{ fontWeight: 700, opacity: 0.6 }}>
      {text}
    </Typography>
    {showSignInHint && <PracticeSignInHint />}
  </Box>
);

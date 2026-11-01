'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { QuizResetButton } from '@/components/common/quiz/QuizResetButton';

import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticeBankHeaderProps {
  bank: QuizBank;
  /** Something was answered: the reset button shows */
  canReset: boolean;
  onReset: () => void;
}

/** Bank title, description and "Reset progress for this quiz bank". */
export const PracticeBankHeader: FC<PracticeBankHeaderProps> = ({ bank, canReset, onReset }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
        {bank.title}
      </Typography>
      {bank.description && (
        <Typography variant="body2" color="text.secondary">
          {bank.description}
        </Typography>
      )}
    </Box>
    {canReset && <QuizResetButton bankTitle={bank.title} onReset={onReset} />}
  </Box>
);

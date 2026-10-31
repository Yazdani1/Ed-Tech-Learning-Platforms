'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizResetButton } from './QuizResetButton';

import type { Subsection } from './quiz.utils';
import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizPanelHeaderProps {
  bank: QuizBank;
  subsection: Subsection;
  /** Questions in the open subsection */
  questionCount: number;
  /** Shows the reset button (only when something was answered) */
  canReset: boolean;
  onReset: () => void;
}

const CHIP_COLOR: Record<Subsection, 'default' | 'error' | 'success'> = {
  all: 'default',
  incorrect: 'error',
  correct: 'success',
};

/** Bank title and description, the open subsection, its question count and the reset button. */
export const QuizPanelHeader: FC<QuizPanelHeaderProps> = ({
  bank,
  subsection,
  questionCount,
  canReset,
  onReset,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" variant="h5" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
            {bank.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bank.description}
          </Typography>
        </Box>
        {canReset && <QuizResetButton bankTitle={bank.title} onReset={onReset} />}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip
          label={t(`learn.quiz.subsectionTitle.${subsection}`)}
          color={CHIP_COLOR[subsection]}
          size="small"
          sx={{ fontWeight: 700 }}
        />
        <Chip
          label={t('learn.quiz.questionCount', { count: questionCount })}
          size="small"
          variant="outlined"
        />
      </Box>
    </>
  );
};

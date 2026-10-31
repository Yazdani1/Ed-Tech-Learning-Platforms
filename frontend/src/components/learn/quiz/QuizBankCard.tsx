'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { statsOf, SUBSECTIONS } from './quiz.utils';
import { QuizResetButton } from './QuizResetButton';
import { SubsectionButton } from './SubsectionButton';

import type { AnswerMap } from './quiz.utils';
import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizBankCardProps {
  bank: QuizBank;
  answers: AnswerMap;
  practice: QuizPractice;
}

/** One quiz bank: title, description, and "All / Wrong / Correct" buttons with progress; reset progress. */
export const QuizBankCard: FC<QuizBankCardProps> = ({ bank, answers, practice }) => {
  const { t } = useTranslation();
  const stats = statsOf(bank.questions, answers);
  const isSelected = practice.selection?.bankId === bank._id;
  const counts = { all: stats.total, incorrect: stats.incorrect, correct: stats.correct };
  return (
    <Paper
      component="article"
      aria-label={bank.title}
      variant="outlined"
      sx={{ p: 1.5, borderColor: isSelected ? 'primary.main' : 'divider' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
            {bank.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {bank.description}
          </Typography>
        </Box>
        {bank.isFreePreview && (
          <Chip label={t('learn.quiz.freePreview')} size="small" color="success" />
        )}
        {stats.answered > 0 && (
          <QuizResetButton
            bankTitle={bank.title}
            onReset={() => {
              practice.reset(bank._id);
            }}
          />
        )}
      </Box>
      <Stack spacing={0.75}>
        {SUBSECTIONS.map((subsection) => (
          <SubsectionButton
            key={subsection}
            subsection={subsection}
            count={counts[subsection]}
            stats={stats}
            selected={isSelected && practice.selection?.subsection === subsection}
            onClick={() => {
              practice.select({ bankId: bank._id, subsection });
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
};

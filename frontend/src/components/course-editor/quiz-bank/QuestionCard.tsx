'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { OPTION_LABELS } from '@/schemas/course-editor.schema';

import { EditDeleteMenu } from '@/components/common/EditDeleteMenu';

import { QuestionOptionRow } from './QuestionOptionRow';

import type { FC } from 'react';
import { type QuizQuestion } from '@/schemas/quiz.schema';

interface QuestionCardProps {
  question: QuizQuestion;
  number: number;
  onEdit: (question: QuizQuestion) => void;
  onDelete: (question: QuizQuestion) => void;
}

const CARD_SX = { p: { xs: 1.5, sm: 2 }, borderRadius: 0.5, listStyle: 'none' } as const;
const HEAD_SX = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 1,
  mb: 1.5,
} as const;

/** A question with its options; staff see the correct answers (green, with a tick) and explanations. */
export const QuestionCard: FC<QuestionCardProps> = ({ question, number, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <Paper component="li" variant="outlined" sx={CARD_SX}>
      <Box sx={HEAD_SX}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', minWidth: 0 }}>
          <Chip label={number} size="small" sx={{ fontWeight: 700, flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word' }}
          >
            {question.question}
          </Typography>
        </Box>
        <EditDeleteMenu
          label={t('catalog.quiz.questionActions', { n: number })}
          onEdit={() => {
            onEdit(question);
          }}
          onDelete={() => {
            onDelete(question);
          }}
        />
      </Box>
      <Stack component="ol" spacing={0.5} sx={{ listStyle: 'none', m: 0, p: 0, pl: { sm: 4.5 } }}>
        {question.options.map((option, index) => (
          <QuestionOptionRow
            key={OPTION_LABELS[index] ?? index}
            option={option}
            letter={OPTION_LABELS[index] ?? String(index + 1)}
            isCorrect={(question.correctOptionIndices ?? []).includes(index)}
          />
        ))}
      </Stack>
    </Paper>
  );
};

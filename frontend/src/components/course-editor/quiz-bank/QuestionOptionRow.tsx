'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import type { FC } from 'react';
import type { QuizQuestion } from '@/schemas/quiz.schema';

interface QuestionOptionRowProps {
  option: QuizQuestion['options'][number];
  letter: string;
  isCorrect: boolean;
}

const CORRECT_TINT = 0.1;

/** One option of a question in the list (correct ones green with a tick, explanation in italics). */
export const QuestionOptionRow: FC<QuestionOptionRowProps> = ({ option, letter, isCorrect }) => {
  const { t } = useTranslation();
  return (
    <Box
      component="li"
      aria-label={isCorrect ? t('catalog.quiz.correctOption', { letter }) : undefined}
      sx={{
        display: 'flex',
        gap: 1,
        p: 0.75,
        borderRadius: 0.5,
        border: 1,
        borderColor: isCorrect ? 'success.main' : 'divider',
        bgcolor: (theme) =>
          isCorrect ? alpha(theme.palette.success.main, CORRECT_TINT) : theme.palette.grey[50],
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          minWidth: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          color: isCorrect ? 'success.dark' : 'text.secondary',
        }}
      >
        {letter}
        {isCorrect && <CheckCircleIcon sx={{ fontSize: 14 }} aria-hidden />}
      </Typography>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{ display: 'block', fontWeight: 500, wordBreak: 'break-word' }}
        >
          {option.text}
        </Typography>
        {option.explanation && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic' }}
          >
            {option.explanation}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizOption } from './QuizOption';
import { QuizQuestionButtons } from './QuizQuestionButtons';

import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizAnswer, QuizQuestion } from '@/schemas/quiz.schema';

interface QuizQuestionCardProps {
  question: QuizQuestion;
  number: number;
  total: number;
  /** The student's stored answer (then the result is shown and the options are locked) */
  answer: QuizAnswer | undefined;
  practice: QuizPractice;
  isLast: boolean;
}

/** One question: tick options, "Check Answer"; after answering the result, correct options and explanations. */
export const QuizQuestionCard: FC<QuizQuestionCardProps> = ({
  question,
  number,
  total,
  answer,
  practice,
  isLast,
}) => {
  const { t } = useTranslation();
  const checked = answer !== undefined;
  const selected = answer?.selectedOptionIndices ?? practice.picked;
  // Arrive with the bank list once the question is answered (never before)
  const correct = question.correctOptionIndices ?? [];
  const label = t('learn.quiz.questionOf', { number, total });

  return (
    <Paper variant="outlined" component="article" aria-label={label} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip label={label} size="small" sx={{ fontWeight: 700 }} />
        <Chip label={t('learn.quiz.selectAll')} size="small" color="info" variant="outlined" />
      </Box>
      <Typography component="h3" variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.05rem' }}>
        {question.question}
      </Typography>
      <Stack spacing={1.25} role="group" aria-label={t('learn.quiz.options')}>
        {question.options.map((option, index) => (
          <QuizOption
            key={index}
            index={index}
            text={option.text}
            explanation={checked ? option.explanation : undefined}
            selected={selected.includes(index)}
            checked={checked}
            correct={correct.includes(index)}
            onToggle={() => {
              practice.toggleOption(index);
            }}
          />
        ))}
      </Stack>
      {answer && (
        <Alert severity={answer.isCorrect ? 'success' : 'error'} sx={{ mt: 2 }}>
          {t(answer.isCorrect ? 'learn.quiz.correct' : 'learn.quiz.incorrect')}
        </Alert>
      )}
      <QuizQuestionButtons
        checked={checked}
        canCheck={practice.picked.length > 0 && !practice.submitting}
        isLast={isLast}
        onCheck={() => {
          practice.submit(question._id);
        }}
        onNext={() => {
          practice.setPage(number);
        }}
      />
    </Paper>
  );
};

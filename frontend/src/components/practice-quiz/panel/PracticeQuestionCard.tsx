'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { QuizOption } from '@/components/common/quiz/QuizOption';
import { QuizQuestionButtons } from '@/components/common/quiz/QuizQuestionButtons';

import type { Reveal } from '../usePracticeAnswers';
import type { FC } from 'react';
import type { QuizAnswer, QuizQuestion } from '@/schemas/quiz.schema';

interface PracticeQuestionCardProps {
  question: QuizQuestion;
  number: number;
  total: number;
  /** The answer already given (then the options are locked and the result shows) */
  answer: QuizAnswer | undefined;
  /** Correct options and explanations, known only after answering */
  reveal: Reveal | undefined;
  /** False while the sign-in check or an answer check runs */
  canCheck: boolean;
  onCheck: (selected: number[]) => void;
  onNext: () => void;
  isLast: boolean;
}

const toggle = (list: number[], index: number): number[] =>
  list.includes(index) ? list.filter((item) => item !== index) : [...list, index];

/**
 * One question: tick options, "Check Answer"; then green/red options, explanations and the result. The page
 * gives it a key per bank + question, so the ticked options start empty for every question.
 */
export const PracticeQuestionCard: FC<PracticeQuestionCardProps> = ({
  question,
  number,
  total,
  answer,
  reveal,
  canCheck,
  onCheck,
  onNext,
  isLast,
}) => {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number[]>([]);
  const checked = answer !== undefined;
  const selected = answer?.selectedOptionIndices ?? picked;
  const correct = reveal?.correctOptionIndices ?? question.correctOptionIndices ?? [];
  const label = t('quiz.common.questionOf', { number, total });

  return (
    <Paper variant="outlined" component="article" aria-label={label} sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Chip label={label} size="small" sx={{ fontWeight: 700 }} />
        <Chip label={t('quiz.common.selectAll')} size="small" color="info" variant="outlined" />
      </Box>
      <Typography component="h3" variant="h6" sx={{ fontWeight: 600, mb: 3, fontSize: '1.05rem' }}>
        {question.question}
      </Typography>
      <Stack spacing={1.25} role="group" aria-label={t('quiz.common.options')}>
        {question.options.map((option, index) => (
          <QuizOption
            key={index}
            index={index}
            text={option.text}
            explanation={checked ? (reveal?.explanations[index] ?? option.explanation) : undefined}
            selected={selected.includes(index)}
            checked={checked}
            correct={correct.includes(index)}
            onToggle={() => {
              setPicked((current) => toggle(current, index));
            }}
          />
        ))}
      </Stack>
      {answer && (
        <Alert severity={answer.isCorrect ? 'success' : 'error'} sx={{ mt: 2 }}>
          {t(answer.isCorrect ? 'quiz.common.correct' : 'quiz.common.incorrect')}
        </Alert>
      )}
      <QuizQuestionButtons
        checked={checked}
        canCheck={canCheck && picked.length > 0}
        isLast={isLast}
        onCheck={() => {
          onCheck(picked);
        }}
        onNext={onNext}
      />
    </Paper>
  );
};

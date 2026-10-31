'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizPracticePanel } from './QuizPracticePanel';

import type { AnswerMap } from './quiz.utils';
import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizPracticeAreaProps {
  /** The chosen bank, if any */
  bank: QuizBank | undefined;
  answers: AnswerMap;
  practice: QuizPractice;
}

/** The practice panel of the chosen bank (with "Back to quiz banks" on phones), or a hint to choose one. */
export const QuizPracticeArea: FC<QuizPracticeAreaProps> = ({ bank, answers, practice }) => {
  const { t } = useTranslation();
  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => {
          practice.select(null);
        }}
        sx={{ display: { md: 'none' }, mb: 1, minHeight: 44 }}
      >
        {t('learn.quiz.backToBanks')}
      </Button>
      {bank && practice.selection ? (
        <QuizPracticePanel
          bank={bank}
          answers={answers}
          practice={practice}
          subsection={practice.selection.subsection}
        />
      ) : (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <QuizOutlinedIcon sx={{ fontSize: 72, opacity: 0.2 }} aria-hidden />
          <Typography variant="h6" sx={{ opacity: 0.6 }}>
            {t('learn.quiz.select')}
          </Typography>
        </Box>
      )}
    </>
  );
};

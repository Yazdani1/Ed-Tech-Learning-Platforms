'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizSectionGroup } from './QuizSectionGroup';

import type { AnswerMap } from './quiz.utils';
import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizBank, QuizSection } from '@/schemas/quiz.schema';

interface QuizBankListProps {
  sections: QuizSection[];
  banks: QuizBank[];
  answers: AnswerMap;
  practice: QuizPractice;
}

/** Quiz sections (first one open) with their banks and the student's progress in each. */
export const QuizBankList: FC<QuizBankListProps> = ({ sections, banks, answers, practice }) => {
  const { t } = useTranslation();
  return (
    <Paper
      variant="outlined"
      component="nav"
      aria-label={t('learn.quiz.banks')}
      sx={{ overflow: 'hidden' }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700 }}>
          {t('learn.quiz.title')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('learn.quiz.sectionCount', { count: sections.length })}
        </Typography>
      </Box>
      {sections.map((section, index) => (
        <QuizSectionGroup
          key={section._id}
          section={section}
          banks={banks.filter((bank) => bank.quizSection === section._id)}
          defaultExpanded={index === 0}
          answers={answers}
          practice={practice}
        />
      ))}
    </Paper>
  );
};

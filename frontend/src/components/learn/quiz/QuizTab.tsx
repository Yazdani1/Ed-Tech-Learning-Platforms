'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useMyQuizAttempts } from '@/api/learn-quiz.api';
import { QueryState } from '@/components/common/QueryState';

import { courseQuestions, statsOf, toAnswerMap } from './quiz.utils';
import { QuizBankList } from './QuizBankList';
import { QuizPracticeArea } from './QuizPracticeArea';
import { QuizStatsBar } from './QuizStatsBar';
import { useQuizPractice } from './useQuizPractice';

import type { FC } from 'react';
import { useQuizBanks, useQuizSections } from '@/api/quiz.api';

interface QuizTabProps {
  courseId: string;
}

const LIST_WIDTH = 380;

/**
 * Quiz practice: quiz banks by section with the student's progress, and a panel that asks one question at a
 * time. Answers are marked on the server; the correct answers only arrive after answering. On phones the
 * bank list and the panel take turns.
 */
export const QuizTab: FC<QuizTabProps> = ({ courseId }) => {
  const { t } = useTranslation();
  const sections = useQuizSections(courseId);
  const banks = useQuizBanks(courseId);
  const attempts = useMyQuizAttempts(courseId);
  const practice = useQuizPractice(courseId);
  const answers = toAnswerMap(attempts.data ?? []);
  const sectionList = sections.data ?? [];
  const bankList = banks.data ?? [];
  const bank = bankList.find((item) => item._id === practice.selection?.bankId);
  const courseStats = statsOf(courseQuestions(sectionList, bankList), answers);

  return (
    <Box component="section" aria-label={t('learn.nav.quiz')} sx={{ p: { xs: 2, md: 3 } }}>
      <QueryState
        isLoading={sections.isPending || banks.isPending || attempts.isPending}
        error={sections.error ?? banks.error ?? attempts.error}
        onRetry={() => void Promise.all([sections.refetch(), banks.refetch(), attempts.refetch()])}
        isEmpty={sectionList.length === 0}
        emptyText={t('learn.quiz.empty')}
      >
        {courseStats.total > 0 && (
          <Box sx={{ mb: 2 }}>
            <QuizStatsBar stats={courseStats} label={t('learn.quiz.courseProgress')} />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0, display: { xs: bank ? 'block' : 'none', md: 'block' } }}>
            <QuizPracticeArea bank={bank} answers={answers} practice={practice} />
          </Box>
          <Box
            sx={{
              width: { xs: '100%', md: LIST_WIDTH },
              flexShrink: 0,
              display: { xs: bank ? 'none' : 'block', md: 'block' },
            }}
          >
            <QuizBankList
              sections={sectionList}
              banks={bankList}
              answers={answers}
              practice={practice}
            />
          </Box>
        </Box>
      </QueryState>
    </Box>
  );
};

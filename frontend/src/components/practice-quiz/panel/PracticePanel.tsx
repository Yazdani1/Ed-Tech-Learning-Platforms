'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';

import { QuizStatsBar } from '@/components/common/quiz/QuizStatsBar';
import { statsOf, type Subsection } from '@/components/common/quiz/quiz.utils';

import { treeQuestions } from '../practice-quiz.utils';

import { PracticeBankHeader } from './PracticeBankHeader';
import { PracticeEmptyState } from './PracticeEmptyState';
import { PracticeQuestionArea } from './PracticeQuestionArea';
import { PracticeSignInHint } from './PracticeSignInHint';

import type { PracticeAnswers } from '../usePracticeAnswers';
import type { FC } from 'react';
import type { PracticeTree } from '@/schemas/practice-quiz.schema';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticePanelProps {
  courseId: string | null;
  tree: PracticeTree | undefined;
  bank: QuizBank | null;
  bankMissing: boolean;
  subsection: Subsection;
  page: number;
  onPageChange: (page: number) => void;
  practice: PracticeAnswers;
  onCheck: (bankId: string, questionId: string, selected: number[]) => void;
  onReset: (bankId: string) => void;
}

/** The practice area: progress of the course and the bank, the current question and the question pager. */
export const PracticePanel: FC<PracticePanelProps> = ({
  courseId,
  tree,
  bank,
  bankMissing,
  subsection,
  page,
  onPageChange,
  practice,
  onCheck,
  onReset,
}) => {
  const { t } = useTranslation();
  const isGuest = practice.mode === 'guest';
  if (!bank) {
    const text = courseId ? 'quiz.practice.panel.pickBank' : 'quiz.practice.panel.pickCourse';
    return <PracticeEmptyState text={t(text)} showSignInHint={isGuest} />;
  }
  const bankStats = statsOf(bank.questions, practice.answers);
  return (
    <Stack spacing={2} sx={{ p: { xs: 1.5, md: 2 }, maxWidth: 760, mx: 'auto', width: '100%' }}>
      {bankMissing && <Alert severity="info">{t('quiz.practice.panel.bankMissing')}</Alert>}
      {practice.error && (
        <Alert severity="warning">
          {t('quiz.practice.panel.savedError', { message: practice.error.message })}
        </Alert>
      )}
      {isGuest && <PracticeSignInHint />}
      <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
        <QuizStatsBar
          stats={statsOf(treeQuestions(tree), practice.answers)}
          label={t('quiz.practice.panel.course')}
        />
        <QuizStatsBar stats={bankStats} label={t('quiz.practice.panel.bank')} />
      </Box>
      <PracticeBankHeader
        bank={bank}
        canReset={bankStats.answered > 0}
        onReset={() => {
          onReset(bank._id);
        }}
      />
      <PracticeQuestionArea
        bank={bank}
        subsection={subsection}
        page={page}
        onPageChange={onPageChange}
        practice={practice}
        onCheck={(questionId, selected) => {
          onCheck(bank._id, questionId, selected);
        }}
      />
    </Stack>
  );
};

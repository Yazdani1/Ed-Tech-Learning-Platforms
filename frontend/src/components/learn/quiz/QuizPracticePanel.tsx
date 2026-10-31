'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { statsOf, subsectionQuestions, type AnswerMap, type Subsection } from './quiz.utils';
import { QuizPager } from './QuizPager';
import { QuizPanelHeader } from './QuizPanelHeader';
import { QuizQuestionCard } from './QuizQuestionCard';
import { QuizStatsBar } from './QuizStatsBar';

import type { QuizPractice } from './useQuizPractice';
import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface QuizPracticePanelProps {
  bank: QuizBank;
  subsection: Subsection;
  answers: AnswerMap;
  practice: QuizPractice;
}

/** The chosen bank: header, its progress, the current question and the question pager. */
export const QuizPracticePanel: FC<QuizPracticePanelProps> = ({
  bank,
  subsection,
  answers,
  practice,
}) => {
  const { t } = useTranslation();
  const questions = subsectionQuestions(bank, answers, subsection);
  const stats = statsOf(bank.questions, answers);
  const page = Math.min(practice.page, Math.max(questions.length - 1, 0));
  const question = questions[page];

  return (
    <Box component="section" aria-label={bank.title} sx={{ maxWidth: 740, mx: 'auto' }}>
      <QuizPanelHeader
        bank={bank}
        subsection={subsection}
        questionCount={questions.length}
        canReset={stats.answered > 0}
        onReset={() => {
          practice.reset(bank._id);
        }}
      />
      <Box sx={{ mb: 2 }}>
        <QuizStatsBar stats={stats} label={t('learn.quiz.bankProgress')} />
      </Box>
      {question ? (
        <>
          <QuizQuestionCard
            key={question._id}
            question={question}
            number={page + 1}
            total={questions.length}
            answer={answers.get(question._id)}
            practice={practice}
            isLast={page >= questions.length - 1}
          />
          <QuizPager
            questions={questions}
            answers={answers}
            page={page}
            onChange={practice.setPage}
          />
        </>
      ) : (
        <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
          {t(`learn.quiz.emptySubsection.${subsection}`)}
        </Typography>
      )}
    </Box>
  );
};

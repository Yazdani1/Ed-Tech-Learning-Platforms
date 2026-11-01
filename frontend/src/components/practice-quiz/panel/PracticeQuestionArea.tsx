'use client';

import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuizPager } from '@/components/common/quiz/QuizPager';
import { subsectionQuestions, type Subsection } from '@/components/common/quiz/quiz.utils';

import { PracticeQuestionCard } from './PracticeQuestionCard';
import { PracticeSubsectionTitle } from './PracticeSubsectionTitle';

import type { PracticeAnswers } from '../usePracticeAnswers';
import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticeQuestionAreaProps {
  bank: QuizBank;
  subsection: Subsection;
  page: number;
  onPageChange: (page: number) => void;
  practice: PracticeAnswers;
  onCheck: (questionId: string, selected: number[]) => void;
}

/** The subsection's current question with the pager, or "No incorrect answers yet" and the like. */
export const PracticeQuestionArea: FC<PracticeQuestionAreaProps> = ({
  bank,
  subsection,
  page,
  onPageChange,
  practice,
  onCheck,
}) => {
  const { t } = useTranslation();
  const questions = subsectionQuestions(bank, practice.answers, subsection);
  // A reset can shrink the Wrong / Correct lists under the current index
  const index = Math.min(page, Math.max(questions.length - 1, 0));
  const question = questions[index];

  if (!question) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <QuizOutlinedIcon sx={{ fontSize: 48, opacity: 0.3 }} aria-hidden />
        <Typography>{t(`quiz.common.emptySubsection.${subsection}`)}</Typography>
      </Box>
    );
  }
  return (
    <>
      <PracticeSubsectionTitle subsection={subsection} count={questions.length} />
      <PracticeQuestionCard
        key={`${bank._id}:${question._id}`}
        question={question}
        number={index + 1}
        total={questions.length}
        answer={practice.answers.get(question._id)}
        reveal={practice.reveal.get(question._id)}
        canCheck={practice.mode !== 'pending' && !practice.checking}
        onCheck={(selected) => {
          onCheck(question._id, selected);
        }}
        onNext={() => {
          onPageChange(index + 1);
        }}
        isLast={index >= questions.length - 1}
      />
      <QuizPager
        questions={questions}
        answers={practice.answers}
        page={index}
        onChange={onPageChange}
      />
    </>
  );
};

'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { QuizResetButton } from '@/components/common/quiz/QuizResetButton';
import {
  subsectionQuestions,
  SUBSECTIONS,
  type AnswerMap,
  type QuizStats,
  type Subsection,
} from '@/components/common/quiz/quiz.utils';
import { SubsectionButton } from '@/components/common/quiz/SubsectionButton';

import type { FC } from 'react';
import type { QuizBank } from '@/schemas/quiz.schema';

interface PracticeBankDetailsProps {
  bank: QuizBank;
  answers: AnswerMap;
  stats: QuizStats;
  selected: Subsection | null;
  onSelect: (subsection: Subsection) => void;
  onReset: () => void;
}

/** An open bank: All / Wrong / Correct buttons, and the reset button once something was answered. */
export const PracticeBankDetails: FC<PracticeBankDetailsProps> = ({
  bank,
  answers,
  stats,
  selected,
  onSelect,
  onReset,
}) => (
  <>
    <Stack spacing={0.75}>
      {SUBSECTIONS.map((subsection) => (
        <SubsectionButton
          key={subsection}
          subsection={subsection}
          count={subsectionQuestions(bank, answers, subsection).length}
          stats={stats}
          selected={selected === subsection}
          onClick={() => {
            onSelect(subsection);
          }}
        />
      ))}
    </Stack>
    {stats.answered > 0 && (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
        <QuizResetButton bankTitle={bank.title} onReset={onReset} />
      </Box>
    )}
  </>
);

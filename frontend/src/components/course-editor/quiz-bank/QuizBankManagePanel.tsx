'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QuestionCard } from './QuestionCard';
import { QuizBankPanelHeader } from './QuizBankPanelHeader';

import type { QuizBankUi } from './useQuizBankUi';
import type { FC } from 'react';
import type { QuizBank, QuizQuestion } from '@/schemas/quiz.schema';

interface QuizBankManagePanelProps {
  bank: QuizBank;
  ui: QuizBankUi;
}

const PANEL_SX = { p: { xs: 0, md: 3 }, maxWidth: 740, mx: 'auto' } as const;

/** The open bank: header, and its questions with the correct answers (edit / delete each). */
export const QuizBankManagePanel: FC<QuizBankManagePanelProps> = ({ bank, ui }) => {
  const { t } = useTranslation();
  const openQuestion = (question?: QuizQuestion): void => {
    ui.questionModal.openModal({ bankId: bank._id, question });
  };

  return (
    <Box component="section" aria-label={bank.title} sx={PANEL_SX}>
      <QuizBankPanelHeader
        bank={bank}
        onEditBank={() => {
          ui.handlers.onEditBank(bank);
        }}
        onAddQuestion={() => {
          openQuestion();
        }}
      />
      <Typography variant="subtitle2" component="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t('catalog.quiz.questions', { count: bank.questions.length })}
      </Typography>
      {bank.questions.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          {t('catalog.quiz.noQuestions')}
        </Typography>
      ) : (
        <Stack component="ol" spacing={1.5} sx={{ m: 0, p: 0 }}>
          {bank.questions.map((question, index) => (
            <QuestionCard
              key={question._id}
              question={question}
              number={index + 1}
              onEdit={openQuestion}
              onDelete={(item) => {
                ui.actions.deleteQuestion(bank._id, item);
              }}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

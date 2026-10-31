'use client';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { QaQuestionRow } from './QaQuestionRow';

import type { QaActions } from './useQaActions';
import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionRowsProps {
  /** The questions of the current page */
  questions: QaQuestion[];
  actions: QaActions;
  onOpen: (questionId: string) => void;
  onEdit: (question: QaQuestion) => void;
}

/** The questions of one page, or "No questions in this filter". */
export const QaQuestionRows: FC<QaQuestionRowsProps> = ({ questions, actions, onOpen, onEdit }) => {
  const { t } = useTranslation();
  if (questions.length === 0)
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
        <ForumOutlinedIcon sx={{ fontSize: 48 }} aria-hidden />
        <Typography sx={{ fontWeight: 700 }}>{t('learn.qa.noneInFilter')}</Typography>
      </Box>
    );
  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {questions.map((question, index) => (
        <QaQuestionRow
          key={question._id}
          question={question}
          first={index === 0}
          actions={actions}
          onOpen={() => {
            onOpen(question._id);
          }}
          onEdit={() => {
            onEdit(question);
          }}
        />
      ))}
    </Paper>
  );
};

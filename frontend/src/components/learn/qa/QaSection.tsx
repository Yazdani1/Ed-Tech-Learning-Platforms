'use client';

import Box from '@mui/material/Box';

import { useLearnTab } from '../useLearnTab';

import { QaQuestionDetailView } from './QaQuestionDetailView';
import { QaQuestionList } from './QaQuestionList';

import type { FC } from 'react';

interface QaSectionProps {
  courseId: string;
}

/** Course Q&A: the question list, or one question with its answers (?questionId= in the URL). */
export const QaSection: FC<QaSectionProps> = ({ courseId }) => {
  const { questionId, openQuestion } = useLearnTab();
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 860 }}>
      {questionId ? (
        <QaQuestionDetailView
          courseId={courseId}
          questionId={questionId}
          onBack={() => {
            openQuestion(null);
          }}
        />
      ) : (
        <QaQuestionList courseId={courseId} onOpen={openQuestion} />
      )}
    </Box>
  );
};

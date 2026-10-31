'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { SafeHtml } from '@/components/common/SafeHtml';

import { PostedByLine } from '@/components/common/PostedByLine';
import { useLearnPermissions } from '../useLearnPermissions';

import { QaQuestionActions } from './QaQuestionActions';
import { QaStatusChips } from './QaStatusChips';
import { UpvoteButton } from './UpvoteButton';
import { useQaActions } from './useQaActions';

import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionCardProps {
  courseId: string;
  question: QaQuestion;
  onEdit: () => void;
  /** After the question was deleted (back to the list) */
  onDeleted: () => void;
}

/** The opened question: poster, status, title, full text, vote, resolve and the edit/delete menu. */
export const QaQuestionCard: FC<QaQuestionCardProps> = ({
  courseId,
  question,
  onEdit,
  onDeleted,
}) => {
  const permissions = useLearnPermissions();
  const actions = useQaActions(courseId);
  return (
    <Paper
      component="article"
      aria-label={question.title}
      variant="outlined"
      sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}
    >
      <PostedByLine
        postedBy={question.postedBy}
        createdAt={question.createdAt}
        userId={permissions.userId}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1.5 }}>
        <QaStatusChips question={question} />
      </Box>
      <Typography
        component="h2"
        variant="h5"
        sx={{ fontWeight: 700, mb: 1.5, wordBreak: 'break-word' }}
      >
        {question.title}
      </Typography>
      <SafeHtml html={question.description} sx={{ fontSize: '0.9rem', lineHeight: 1.7 }} />
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        <UpvoteButton
          upvotes={question.upvotes}
          userId={permissions.userId}
          onClick={() => {
            actions.upvote(question);
          }}
        />
        <Box sx={{ flex: 1 }} />
        <QaQuestionActions
          question={question}
          actions={actions}
          onEdit={onEdit}
          onDeleted={onDeleted}
        />
      </Box>
    </Paper>
  );
};

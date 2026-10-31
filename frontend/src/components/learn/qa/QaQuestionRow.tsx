'use client';

import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { htmlToPlainText } from '@/utils/html-text';

import { PostedByLine } from '@/components/common/PostedByLine';
import { useLearnPermissions } from '../useLearnPermissions';

import { needsStaffAnswer } from './qa.utils';
import { QaQuestionActions } from './QaQuestionActions';
import { QaStatusChips } from './QaStatusChips';
import { UpvoteButton } from './UpvoteButton';

import type { QaActions } from './useQaActions';
import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionRowProps {
  question: QaQuestion;
  first: boolean;
  actions: QaActions;
  onOpen: () => void;
  onEdit: () => void;
}

const CLAMP_SX = {
  mb: 1,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
} as const;

/** One question of the list: votes, title (opens it), status, short text, poster and answer counts. */
export const QaQuestionRow: FC<QaQuestionRowProps> = ({
  question,
  first,
  actions,
  onOpen,
  onEdit,
}) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  return (
    <Box
      component="article"
      aria-label={question.title}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: { xs: 1.5, sm: 2.5 },
        borderTop: first ? 0 : 1,
        borderColor: 'divider',
        bgcolor: needsStaffAnswer(question) ? 'rgba(237, 108, 2, 0.06)' : undefined,
      }}
    >
      <UpvoteButton
        upvotes={question.upvotes}
        userId={permissions.userId}
        onClick={() => {
          actions.upvote(question);
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <ButtonBase onClick={onOpen} sx={{ textAlign: 'left', borderRadius: 1, minHeight: 32 }}>
            <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>
              {question.title}
            </Typography>
          </ButtonBase>
          <QaStatusChips question={question} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={CLAMP_SX}>
          {htmlToPlainText(question.description)}
        </Typography>
        <PostedByLine
          postedBy={question.postedBy}
          createdAt={question.createdAt}
          userId={permissions.userId}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <ForumOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} aria-hidden />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flex: 1 }}>
            {t('learn.qa.answerCounts', {
              count: question.answerCount,
              staff: question.staffAnswerCount,
            })}
          </Typography>
          <QaQuestionActions question={question} actions={actions} onEdit={onEdit} />
        </Box>
      </Box>
    </Box>
  );
};

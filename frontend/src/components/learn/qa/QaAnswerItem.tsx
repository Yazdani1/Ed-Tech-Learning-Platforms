'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteQaItem, useUpvoteAnswer } from '@/api/learn-qa.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { SafeHtml } from '@/components/common/SafeHtml';

import { PostedByLine } from '@/components/common/PostedByLine';
import { useDeleteWithConfirm } from '../common/useDeleteWithConfirm';
import { useLearnPermissions } from '../useLearnPermissions';

import { UpvoteButton } from './UpvoteButton';

import type { QaAnswer } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaAnswerItemProps {
  courseId: string;
  questionId: string;
  answer: QaAnswer;
  first: boolean;
  onEdit: () => void;
}

/** One answer: poster, text, upvote, and edit/delete for its author or a staff admin. */
export const QaAnswerItem: FC<QaAnswerItemProps> = ({
  courseId,
  questionId,
  answer,
  first,
  onEdit,
}) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  const upvote = useUpvoteAnswer(questionId);
  const remove = useDeleteWithConfirm(useDeleteQaItem(courseId), t('learn.qa.answerDeleted'));
  const name = answer.postedBy?.name ?? t('learn.unknownUser');

  return (
    <Box
      component="article"
      aria-label={t('learn.qa.answerBy', { name })}
      sx={{ p: { xs: 2, sm: 2.5 }, borderTop: first ? 0 : 1, borderColor: 'divider' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PostedByLine
            postedBy={answer.postedBy}
            createdAt={answer.createdAt}
            userId={permissions.userId}
          />
        </Box>
        {permissions.canManage(answer.postedBy) && (
          <ActionMenu
            label={t('learn.qa.answerActions', { name })}
            items={[
              {
                label: t('common.edit'),
                icon: <EditOutlinedIcon fontSize="small" />,
                onClick: onEdit,
              },
              {
                label: t('common.delete'),
                icon: <DeleteOutlinedIcon fontSize="small" />,
                danger: true,
                onClick: () => {
                  remove(t('learn.qa.thisAnswer'), { kind: 'answers', id: answer._id, questionId });
                },
              },
            ]}
          />
        )}
      </Box>
      <SafeHtml html={answer.body} sx={{ fontSize: '0.875rem', lineHeight: 1.7, mb: 1 }} />
      <UpvoteButton
        upvotes={answer.upvotes}
        userId={permissions.userId}
        onClick={() => {
          upvote.mutate(answer._id, { onError: (error) => toast.error(error.message) });
        }}
      />
    </Box>
  );
};

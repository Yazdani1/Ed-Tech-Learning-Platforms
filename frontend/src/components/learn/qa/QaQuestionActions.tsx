'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import { useLearnPermissions } from '../useLearnPermissions';

import { ResolveButton } from './ResolveButton';

import type { QaActions } from './useQaActions';
import type { QaQuestion } from '@/schemas/learn.schema';
import type { FC } from 'react';

interface QaQuestionActionsProps {
  question: QaQuestion;
  actions: QaActions;
  onEdit: () => void;
  /** After a delete (the detail view goes back to the list) */
  onDeleted?: () => void;
}

/** "Mark solved" (author, teachers, staff admins) and the edit/delete menu (author, staff admins). */
export const QaQuestionActions: FC<QaQuestionActionsProps> = ({
  question,
  actions,
  onEdit,
  onDeleted,
}) => {
  const { t } = useTranslation();
  const permissions = useLearnPermissions();
  return (
    <>
      {permissions.canResolve(question.postedBy) && (
        <ResolveButton
          isResolved={question.isResolved}
          pending={actions.resolvingId === question._id}
          onClick={() => {
            actions.resolve(question);
          }}
        />
      )}
      {permissions.canManage(question.postedBy) && (
        <ActionMenu
          label={t('learn.actionsFor', { title: question.title })}
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
                actions.remove(question, onDeleted);
              },
            },
          ]}
        />
      )}
    </>
  );
};

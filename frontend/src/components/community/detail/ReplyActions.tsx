'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';

import { useArchiveReply, useToggleAccepted } from '@/api/community.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';
import { toastError } from '@/utils/toast-error';

import { useCommunityPermissions } from '../common/useCommunityPermissions';

import type { Reply } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ReplyActionsProps {
  reply: Reply;
  /** Only the discussion's creator may accept answers */
  isPostAuthor: boolean;
}

/** Accept/Accepted (discussion creator only) and the "⋮" Delete menu (author or staff) of an answer. */
export const ReplyActions: FC<ReplyActionsProps> = ({ reply, isPostAuthor }) => {
  const { t } = useTranslation();
  const { canManage } = useCommunityPermissions();
  const accept = useToggleAccepted();
  const archive = useArchiveReply();
  const confirmDelete = useDeleteConfirm();
  const toastResult = useToastResult();
  const acceptTip = reply.isAccepted
    ? t('community.reply.removeAccepted')
    : t('community.reply.markAccepted');

  const remove = async (): Promise<void> => {
    if (!(await confirmDelete(t('community.reply.thisAnswer')))) return;
    await toastResult(archive.mutateAsync(reply._id), t('community.reply.deleted'));
  };

  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      {isPostAuthor && (
        <Tooltip title={acceptTip}>
          <Button
            color={reply.isAccepted ? 'success' : 'inherit'}
            startIcon={<CheckCircleIcon />}
            aria-pressed={reply.isAccepted}
            disabled={accept.isPending}
            onClick={() => {
              accept.mutate(reply._id, { onError: toastError });
            }}
            sx={{ minHeight: 44 }}
          >
            {reply.isAccepted ? t('community.reply.accepted') : t('community.reply.accept')}
          </Button>
        </Tooltip>
      )}
      <ActionMenu
        label={t('community.reply.actions')}
        items={[
          {
            label: t('common.delete'),
            icon: <DeleteOutlinedIcon fontSize="small" />,
            danger: true,
            onClick: () => void remove(),
            visible: canManage(reply.author?._id),
            disabled: archive.isPending,
          },
        ]}
      />
    </Stack>
  );
};

'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { useArchiveChildReply } from '@/api/community.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { SafeHtml } from '@/components/common/SafeHtml';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useToastResult } from '@/hooks/useToastResult';
import { formatDateTime } from '@/utils/dateTime';

import { AuthorLine } from '../common/AuthorLine';
import { useCommunityPermissions } from '../common/useCommunityPermissions';

import type { ChildReply, CommunityBadge } from '@/schemas/community.schema';
import type { FC } from 'react';

interface ChildReplyItemProps {
  childReply: ChildReply;
  badges: CommunityBadge[];
}

/** A reply to an answer: author, date, text and Delete (author or staff). */
export const ChildReplyItem: FC<ChildReplyItemProps> = ({ childReply, badges }) => {
  const { t, i18n } = useTranslation();
  const { canManage } = useCommunityPermissions();
  const archive = useArchiveChildReply();
  const confirmDelete = useDeleteConfirm();
  const toastResult = useToastResult();

  const remove = async (): Promise<void> => {
    if (!(await confirmDelete(t('community.reply.thisReply')))) return;
    await toastResult(archive.mutateAsync(childReply._id), t('community.reply.childDeleted'));
  };

  return (
    <Box component="li" sx={{ py: 1, listStyle: 'none' }}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <AuthorLine author={childReply.author} badges={badges} />
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(childReply.createdAt, i18n.language)}
          </Typography>
        </Box>
        <ActionMenu
          label={t('community.reply.actions')}
          items={[
            {
              label: t('common.delete'),
              icon: <DeleteOutlinedIcon fontSize="small" />,
              danger: true,
              onClick: () => {
                void remove();
              },
              visible: canManage(childReply.author?._id),
              disabled: archive.isPending,
            },
          ]}
        />
      </Stack>
      <SafeHtml html={childReply.body} sx={{ typography: 'body2', '& ul, & ol': { pl: 3 } }} />
    </Box>
  );
};

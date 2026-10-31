'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import { PostedByLine } from '@/components/common/PostedByLine';

import type { PostedBy } from '@/schemas/learn.schema';
import type { FC, ReactNode } from 'react';

interface PostCardProps {
  title: string;
  postedBy: PostedBy | null | undefined;
  createdAt: string | undefined;
  userId: string;
  /** Edit/delete menu (author or staff admin) */
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  children: ReactNode;
}

/** One announcement / study material / live class: poster line, content, and the edit/delete menu. */
export const PostCard: FC<PostCardProps> = ({
  title,
  postedBy,
  createdAt,
  userId,
  canManage,
  onEdit,
  onDelete,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Paper
      component="article"
      aria-label={title}
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PostedByLine postedBy={postedBy} createdAt={createdAt} userId={userId} />
          {children}
        </Box>
        {canManage && (
          <ActionMenu
            label={t('learn.actionsFor', { title })}
            items={[
              {
                label: t('common.edit'),
                icon: <EditOutlinedIcon fontSize="small" />,
                onClick: onEdit,
              },
              {
                label: t('common.delete'),
                icon: <DeleteOutlinedIcon fontSize="small" />,
                onClick: onDelete,
                danger: true,
              },
            ]}
          />
        )}
      </Box>
    </Paper>
  );
};

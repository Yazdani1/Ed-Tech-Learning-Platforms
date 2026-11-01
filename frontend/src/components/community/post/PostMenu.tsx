'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { useTranslation } from 'react-i18next';

import { useArchivePost, useTogglePin } from '@/api/community.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { useModal } from '@/hooks/useModal';
import { useToastResult } from '@/hooks/useToastResult';

import { useCommunityPermissions } from '../common/useCommunityPermissions';

import { EditPostModal } from './EditPostModal';

import type { CommunityChannel, Post } from '@/schemas/community.schema';
import type { FC } from 'react';

interface PostMenuProps {
  post: Post;
  channels: CommunityChannel[];
  /** Called after the discussion was archived (the detail page goes back to the hub) */
  onArchived?: () => void;
}

/** "⋮" menu of a discussion: Edit (author or staff), Pin/Unpin (staff), Delete (author or staff). */
export const PostMenu: FC<PostMenuProps> = ({ post, channels, onArchived }) => {
  const { t } = useTranslation();
  const { canModerate, canManage } = useCommunityPermissions();
  const editModal = useModal();
  const pin = useTogglePin();
  const archive = useArchivePost();
  const confirmDelete = useDeleteConfirm();
  const toastResult = useToastResult();
  const allowed = canManage(post.author?._id);

  const remove = async (): Promise<void> => {
    if (!(await confirmDelete(post.title))) return;
    if (await toastResult(archive.mutateAsync(post._id), t('community.post.archived')))
      onArchived?.();
  };

  return (
    <>
      <ActionMenu
        label={t('community.post.actionsFor', { title: post.title })}
        items={[
          {
            label: t('common.edit'),
            icon: <EditOutlinedIcon fontSize="small" />,
            onClick: () => {
              editModal.openModal();
            },
            visible: allowed,
          },
          {
            label: post.isPinned ? t('community.post.unpin') : t('community.post.pin'),
            icon: <PushPinOutlinedIcon fontSize="small" />,
            onClick: () => {
              void toastResult(
                pin.mutateAsync(post._id),
                post.isPinned ? t('community.post.unpinned') : t('community.post.pinned'),
              );
            },
            visible: canModerate,
            disabled: pin.isPending,
          },
          {
            label: t('common.delete'),
            icon: <DeleteOutlinedIcon fontSize="small" />,
            danger: true,
            onClick: () => {
              void remove();
            },
            visible: allowed,
            disabled: archive.isPending,
          },
        ]}
      />
      {editModal.open && (
        <EditPostModal post={post} channels={channels} onClose={editModal.closeModal} />
      )}
    </>
  );
};

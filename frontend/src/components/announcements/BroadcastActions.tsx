'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useArchiveBroadcast } from '@/api/announcements.api';
import { useConfirm } from '@/hooks/useConfirm';
import { useModal } from '@/hooks/useModal';

import { BroadcastEditModal } from './BroadcastEditModal';
import { BroadcastHistoryModal } from './BroadcastHistoryModal';

import type { BroadcastDetails } from '@/schemas/announcement-broadcast.schema';
import type { FC } from 'react';

interface BroadcastActionsProps {
  item: BroadcastDetails;
  /** Called after the announcement was deleted (archived) */
  onDeleted: () => void;
}

const BUTTON_SX = { minHeight: 44 } as const;

/** Edit (the old text goes to History), History and Delete (archived: hidden everywhere, kept in the database). */
export const BroadcastActions: FC<BroadcastActionsProps> = ({ item, onDeleted }) => {
  const { t } = useTranslation();
  const editModal = useModal();
  const historyModal = useModal();
  const archive = useArchiveBroadcast();
  const confirm = useConfirm();

  const onDelete = async (): Promise<void> => {
    const ok = await confirm({
      title: t('announcements.delete.title'),
      message: t('announcements.delete.message', { title: item.title }),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
    if (!ok) return;
    archive.mutate(item._id, {
      onSuccess: () => {
        toast.success(t('announcements.delete.done'));
        onDeleted();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<EditOutlinedIcon />}
        onClick={() => {
          editModal.openModal();
        }}
        sx={BUTTON_SX}
      >
        {t('common.edit')}
      </Button>
      <Button
        startIcon={<HistoryIcon />}
        onClick={() => {
          historyModal.openModal();
        }}
        sx={BUTTON_SX}
      >
        {t('announcements.history.open')}
      </Button>
      <Button
        color="error"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => void onDelete()}
        disabled={archive.isPending}
        sx={BUTTON_SX}
      >
        {t('common.delete')}
      </Button>
      {editModal.open && <BroadcastEditModal item={item} onClose={editModal.closeModal} />}
      {historyModal.open && (
        <BroadcastHistoryModal id={item._id} title={item.title} onClose={historyModal.closeModal} />
      )}
    </Box>
  );
};

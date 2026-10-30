'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteSetupItem } from '@/api/setup.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import type { SetupItem, SetupKind } from '@/schemas/setup.schema';
import type { FC } from 'react';

interface SetupRowMenuProps {
  kind: SetupKind;
  item: SetupItem;
  onEdit: (item: SetupItem) => void;
}

/** The row menu of a category / course type: Edit, and Delete after confirmation. */
export const SetupRowMenu: FC<SetupRowMenuProps> = ({ kind, item, onEdit }) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deleteItem = useDeleteSetupItem(kind);

  const handleDelete = async (): Promise<void> => {
    if (!(await confirmDelete(item.name))) return;
    deleteItem.mutate(item._id, {
      onSuccess: () => toast.success(t(`showcase.setup.${kind}.deleted`)),
      // An item that courses still use is refused (400): the backend message says how many courses
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <ActionMenu
      label={t('showcase.setup.actionsFor', { name: item.name })}
      items={[
        {
          label: t('common.edit'),
          icon: <EditOutlinedIcon fontSize="small" />,
          onClick: () => {
            onEdit(item);
          },
        },
        {
          label: t('common.delete'),
          icon: <DeleteOutlineIcon fontSize="small" />,
          danger: true,
          onClick: () => void handleDelete(),
        },
      ]}
    />
  );
};

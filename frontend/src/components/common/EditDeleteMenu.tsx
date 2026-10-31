'use client';

import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useTranslation } from 'react-i18next';

import { ActionMenu } from '@/components/common/ActionMenu';

import type { FC } from 'react';

interface EditDeleteMenuProps {
  /** Accessible name of the "⋮" button, e.g. "Actions for Week 1" */
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  /** Text of the first item (default "Edit") */
  editLabel?: string;
}

/** The "⋮" menu with Edit and Delete used by cards and rows (course editor, live classes). */
export const EditDeleteMenu: FC<EditDeleteMenuProps> = ({ label, onEdit, onDelete, editLabel }) => {
  const { t } = useTranslation();
  return (
    <ActionMenu
      label={label}
      items={[
        {
          label: editLabel ?? t('common.edit'),
          icon: <EditOutlinedIcon fontSize="small" />,
          onClick: onEdit,
        },
        {
          label: t('common.delete'),
          icon: <DeleteOutlinedIcon fontSize="small" />,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  );
};

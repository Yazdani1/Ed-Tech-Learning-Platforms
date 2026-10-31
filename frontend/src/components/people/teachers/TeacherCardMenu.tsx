'use client';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteTeacher } from '@/api/people.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { toastError } from '@/utils/toast-error';
import { useDeleteConfirm } from '@/hooks/useConfirm';

import type { AdminTeacher } from '@/schemas/public.schema';
import type { FC } from 'react';

export type TeacherAction = 'details' | 'edit';

interface TeacherCardMenuProps {
  teacher: AdminTeacher;
  onAction: (action: TeacherAction, teacher: AdminTeacher) => void;
}

/** "⋮" menu of a teacher card: View details, Edit, Delete (after confirmation). */
export const TeacherCardMenu: FC<TeacherCardMenuProps> = ({ teacher, onAction }) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deleteTeacher = useDeleteTeacher();

  const handleDelete = async (): Promise<void> => {
    if (!(await confirmDelete(teacher.name))) return;
    void deleteTeacher
      .mutateAsync(teacher._id)
      .then(() => toast.success(t('people.teachers.deleted')))
      .catch(toastError);
  };

  return (
    <ActionMenu
      label={t('people.actionsFor', { name: teacher.name })}
      items={[
        {
          label: t('people.teachers.viewDetails'),
          icon: <VisibilityOutlinedIcon fontSize="small" />,
          onClick: () => {
            onAction('details', teacher);
          },
        },
        {
          label: t('common.edit'),
          icon: <EditOutlinedIcon fontSize="small" />,
          onClick: () => {
            onAction('edit', teacher);
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

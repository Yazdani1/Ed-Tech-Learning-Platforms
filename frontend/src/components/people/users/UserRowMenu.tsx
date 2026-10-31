'use client';

import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteUser } from '@/api/people.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { toastError } from '@/utils/toast-error';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { canManageAccount } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

export type UserAction = 'details' | 'edit' | 'role';

interface UserRowMenuProps {
  user: ManagedUser;
  onAction: (action: UserAction, user: ManagedUser) => void;
}

/**
 * Row menu of a user. Details and Delete: Super Admin only. Edit / Change role: hidden for an Admin on an
 * Admin or Super Admin account (the backend refuses it).
 */
export const UserRowMenu: FC<UserRowMenuProps> = ({ user, onAction }) => {
  const { t } = useTranslation();
  const { user: viewer, hasRole } = useAuth();
  const confirmDelete = useDeleteConfirm();
  const deleteUser = useDeleteUser();
  const isSuperAdmin = hasRole(SUPER_ADMIN_ROLES);
  const canManage = canManageAccount(viewer?.role, user);

  const handleDelete = async (): Promise<void> => {
    if (!(await confirmDelete(user.name))) return;
    // The last Super Admin cannot be deleted: the backend's 400 message is shown
    void deleteUser
      .mutateAsync(user._id)
      .then(() => toast.success(t('people.users.deleted')))
      .catch(toastError);
  };

  return (
    <ActionMenu
      label={t('people.actionsFor', { name: user.name })}
      items={[
        {
          label: t('people.users.viewDetails'),
          icon: <VisibilityOutlinedIcon fontSize="small" />,
          visible: isSuperAdmin,
          onClick: () => {
            onAction('details', user);
          },
        },
        {
          label: t('common.edit'),
          icon: <EditOutlinedIcon fontSize="small" />,
          visible: canManage,
          onClick: () => {
            onAction('edit', user);
          },
        },
        {
          label: t('people.users.changeRole'),
          icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />,
          visible: canManage,
          onClick: () => {
            onAction('role', user);
          },
        },
        {
          label: t('common.delete'),
          icon: <DeleteOutlineIcon fontSize="small" />,
          danger: true,
          visible: isSuperAdmin,
          onClick: () => void handleDelete(),
        },
      ]}
    />
  );
};

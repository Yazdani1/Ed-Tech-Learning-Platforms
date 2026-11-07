'use client';

import BlockIcon from '@mui/icons-material/Block';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeleteUser } from '@/api/people.api';
import { ActionMenu } from '@/components/common/ActionMenu';
import { toastError } from '@/utils/toast-error';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteConfirm } from '@/hooks/useConfirm';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { canBlockAccount, canManageAccount } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

export type UserAction = 'details' | 'edit' | 'block' | 'history';

interface UserRowMenuProps {
  user: ManagedUser;
  onAction: (action: UserAction, user: ManagedUser) => void;
}

/**
 * Row menu of a user. Details and Delete: Super Admin only. Edit (name, email, role, password): hidden for an
 * Admin on an Admin or Super Admin account. Block / Unblock: Super Admin anyone, Admin Moderators, Teachers
 * and Students (never yourself). History: role changes and blocks.
 */
/** "Delete": asks first; the last Super Admin cannot be deleted (the backend's 400 message is shown). */
const useUserDelete = (user: ManagedUser): (() => Promise<void>) => {
  const { t } = useTranslation();
  const confirmDelete = useDeleteConfirm();
  const deleteUser = useDeleteUser();
  return async () => {
    if (!(await confirmDelete(user.name))) return;
    void deleteUser
      .mutateAsync(user._id)
      .then(() => toast.success(t('people.users.deleted')))
      .catch(toastError);
  };
};

export const UserRowMenu: FC<UserRowMenuProps> = ({ user, onAction }) => {
  const { t } = useTranslation();
  const { user: viewer, hasRole } = useAuth();
  const isSuperAdmin = hasRole(SUPER_ADMIN_ROLES);
  const canManage = canManageAccount(viewer?.role, user);

  const handleDelete = useUserDelete(user);

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
          label: t(user.isBlocked ? 'people.users.block.unblock' : 'people.users.block.block'),
          icon: user.isBlocked ? <LockOpenIcon fontSize="small" /> : <BlockIcon fontSize="small" />,
          danger: !user.isBlocked,
          visible: canBlockAccount(viewer, user),
          onClick: () => {
            onAction('block', user);
          },
        },
        {
          label: t('people.users.history.open'),
          icon: <HistoryIcon fontSize="small" />,
          visible: canManage,
          onClick: () => {
            onAction('history', user);
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

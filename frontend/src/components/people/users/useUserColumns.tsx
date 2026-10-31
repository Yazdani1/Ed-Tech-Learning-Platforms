'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { RoleChip } from './RoleChip';
import { UserRowMenu, type UserAction } from './UserRowMenu';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { ManagedUser } from '@/schemas/people.schema';

const ACTIONS_WIDTH = 64;

/** Columns of the user list: name, email, role, joined, row menu. */
export const useUserColumns = (
  onAction: (action: UserAction, user: ManagedUser) => void,
): DataColumn<ManagedUser>[] => {
  const { t } = useTranslation();
  return [
    {
      key: 'name',
      header: t('people.users.name'),
      render: (user) => (
        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
          {user.name}
        </Typography>
      ),
    },
    {
      key: 'email',
      header: t('people.users.email'),
      render: (user) => (
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {user.email}
        </Typography>
      ),
    },
    {
      key: 'role',
      header: t('people.users.role'),
      render: (user) => <RoleChip role={user.role} />,
    },
    {
      key: 'joined',
      header: t('people.users.joined'),
      render: (user) => (user.createdAt ? formatDateTime(user.createdAt) : '-'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: ACTIONS_WIDTH,
      render: (user) => <UserRowMenu user={user} onAction={onAction} />,
    },
  ];
};

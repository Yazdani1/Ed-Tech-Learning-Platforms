'use client';

import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';

import { RoleChip } from './RoleChip';
import { UserRowMenu, type UserAction } from './UserRowMenu';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { ManagedUser } from '@/schemas/people.schema';
import type { TFunction } from 'i18next';

const ACTIONS_WIDTH = 64;

const statusColumn = (t: TFunction): DataColumn<ManagedUser> => ({
  key: 'status',
  header: t('people.users.accountStatus'),
  render: (user) => (
    <Chip
      size="small"
      variant="outlined"
      color={user.isBlocked ? 'error' : 'success'}
      label={t(user.isBlocked ? 'people.accountStatus.blocked' : 'people.accountStatus.active')}
    />
  ),
});

/** Columns of the user list: name, email, role, status (active / blocked), joined, row menu. */
export const useUserColumns = (
  onAction: (action: UserAction, user: ManagedUser) => void,
): DataColumn<ManagedUser>[] => {
  const { t } = useTranslation();
  return [
    {
      key: 'name',
      header: t('people.users.name'),
      render: (user) => (
        <>
          <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
            {user.name}
          </Typography>
          {user.studentNumber && (
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {t('people.users.studentNumberShort', { number: user.studentNumber })}
            </Typography>
          )}
        </>
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
    statusColumn(t),
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

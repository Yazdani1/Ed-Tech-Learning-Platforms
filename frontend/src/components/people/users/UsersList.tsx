'use client';

import { useTranslation } from 'react-i18next';

import Checkbox from '@mui/material/Checkbox';

import { ResponsiveDataView, type DataColumn } from '@/components/common/ResponsiveDataView';

import { useUserColumns } from './useUserColumns';

import type { UserAction } from './UserRowMenu';
import type { RowSelection } from '@/hooks/useRowSelection';
import type { ManagedUser, UsersPage } from '@/schemas/people.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface UsersListProps {
  selection: RowSelection<ManagedUser>;
  query: UseQueryResult<UsersPage, ApiError>;
  hasFilters: boolean;
  onAction: (action: UserAction, user: ManagedUser) => void;
  onPageChange: (page: number) => void;
}

const CHECK_WIDTH = 56;

/** The paged user table (cards on phones) with a tick box per row for the export. */
export const UsersList: FC<UsersListProps> = ({
  selection,
  query,
  hasFilters,
  onAction,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const columns: DataColumn<ManagedUser>[] = [
    {
      key: 'select',
      header: '',
      width: CHECK_WIDTH,
      render: (user) => (
        <Checkbox
          checked={selection.isSelected(user)}
          onChange={() => {
            selection.toggle(user);
          }}
          slotProps={{ input: { 'aria-label': t('people.users.selectUser', { name: user.name }) } }}
        />
      ),
    },
    ...useUserColumns(onAction),
  ];
  const pagination = query.data?.pagination;

  return (
    <ResponsiveDataView
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyText={t(hasFilters ? 'people.users.noMatch' : 'people.users.empty')}
      rows={query.data?.data ?? []}
      columns={columns}
      getRowId={(user) => user._id}
      label={t('people.users.title')}
      pagination={
        pagination && {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          onPageChange,
        }
      }
    />
  );
};

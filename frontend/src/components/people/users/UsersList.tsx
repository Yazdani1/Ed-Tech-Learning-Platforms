'use client';

import { useTranslation } from 'react-i18next';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';

import { useUserColumns } from './useUserColumns';

import type { UserAction } from './UserRowMenu';
import type { ManagedUser, UsersPage } from '@/schemas/people.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface UsersListProps {
  query: UseQueryResult<UsersPage, ApiError>;
  hasFilters: boolean;
  onAction: (action: UserAction, user: ManagedUser) => void;
  onPageChange: (page: number) => void;
}

/** The paged user table (cards on phones). */
export const UsersList: FC<UsersListProps> = ({ query, hasFilters, onAction, onPageChange }) => {
  const { t } = useTranslation();
  const columns = useUserColumns(onAction);
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

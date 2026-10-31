'use client';

import { useTranslation } from 'react-i18next';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';

import { useMemberColumns } from './useMemberColumns';

import type { SubscriptionsPage } from '@/schemas/people.schema';
import type { ApiError } from '@/services/http.service';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface MembersListProps {
  query: UseQueryResult<SubscriptionsPage, ApiError>;
  onPageChange: (page: number) => void;
}

/** The paged subscription records (cards on phones). */
export const MembersList: FC<MembersListProps> = ({ query, onPageChange }) => {
  const { t } = useTranslation();
  const columns = useMemberColumns();
  const pagination = query.data?.pagination;

  return (
    <ResponsiveDataView
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyText={t('people.subscriptions.empty')}
      rows={query.data?.data ?? []}
      columns={columns}
      getRowId={(record) => record._id}
      label={t('people.subscriptions.membersTitle')}
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

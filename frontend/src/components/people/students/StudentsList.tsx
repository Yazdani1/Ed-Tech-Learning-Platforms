'use client';

import { useTranslation } from 'react-i18next';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';

import { useStudentColumns } from './useStudentColumns';

import type { StudentRow } from '@/schemas/students.schema';
import type { ApiError } from '@/services/http.service';
import type { ListResult } from '@/types';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface StudentsListProps {
  query: UseQueryResult<ListResult<StudentRow>, ApiError>;
  hasFilters: boolean;
  onOpen: (student: StudentRow) => void;
  onPageChange: (page: number) => void;
}

/** The paged student table (cards on phones); a row opens the details panel. */
export const StudentsList: FC<StudentsListProps> = ({
  query,
  hasFilters,
  onOpen,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const columns = useStudentColumns();
  return (
    <ResponsiveDataView
      isLoading={query.isPending}
      error={query.error}
      onRetry={() => void query.refetch()}
      emptyText={t(hasFilters ? 'people.students.noMatch' : 'people.students.empty')}
      rows={query.data?.items ?? []}
      columns={columns}
      getRowId={(row) => row._id}
      label={t('people.students.title')}
      onRowClick={onOpen}
      pagination={
        query.data && {
          page: query.data.page,
          limit: query.data.limit,
          total: query.data.total,
          onPageChange,
        }
      }
    />
  );
};

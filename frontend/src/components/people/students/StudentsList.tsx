'use client';

import Checkbox from '@mui/material/Checkbox';
import { useTranslation } from 'react-i18next';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';

import { useStudentColumns } from './useStudentColumns';

import type { RowSelection } from '@/hooks/useRowSelection';
import type { StudentRow } from '@/schemas/students.schema';
import type { ApiError } from '@/services/http.service';
import type { ListResult } from '@/types';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FC } from 'react';

interface StudentsListProps {
  /** Super Admin: tick boxes for the export */
  selection?: RowSelection<StudentRow>;
  query: UseQueryResult<ListResult<StudentRow>, ApiError>;
  hasFilters: boolean;
  onOpen: (student: StudentRow) => void;
  onPageChange: (page: number) => void;
}

const CHECK_WIDTH = 56;

/** The paged student table (cards on phones); a row opens the details panel. */
export const StudentsList: FC<StudentsListProps> = ({
  selection,
  query,
  hasFilters,
  onOpen,
  onPageChange,
}) => {
  const { t } = useTranslation();
  const studentColumns = useStudentColumns();
  const columns = selection
    ? [
        {
          key: 'select',
          header: '',
          width: CHECK_WIDTH,
          render: (row: StudentRow) => (
            <Checkbox
              checked={selection.isSelected(row)}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onChange={() => {
                selection.toggle(row);
              }}
              slotProps={{
                input: { 'aria-label': t('people.students.selectStudent', { name: row.name }) },
              }}
            />
          ),
        },
        ...studentColumns,
      ]
    : studentColumns;
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

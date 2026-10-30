'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { DataCards } from './DataCards';
import { DataTable } from './DataTable';
import { ListPagination } from './ListPagination';
import { QueryState } from './QueryState';

import type { DataViewBodyProps } from './data-view.types';
import type { ReactElement, ReactNode } from 'react';

export type { DataColumn } from './data-view.types';

export interface ResponsiveDataViewProps<T> extends DataViewBodyProps<T> {
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  emptyText?: string;
  emptyAction?: ReactNode;
  /** Custom mobile card; by default every visible column becomes a "Header: value" line */
  renderCard?: (row: T) => ReactNode;
  pagination?: { page: number; limit: number; total: number; onPageChange: (page: number) => void };
}

/**
 * Lists everywhere: a table from 900 px up, cards below it, the same pagination under both, plus
 * loading / error / empty states. (Generic, so it is a function rather than an FC.)
 */
export const ResponsiveDataView = <T,>({
  isLoading,
  error,
  onRetry,
  emptyText,
  emptyAction,
  renderCard,
  pagination,
  ...body
}: ResponsiveDataViewProps<T>): ReactElement => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      isEmpty={body.rows.length === 0}
      onRetry={onRetry}
      emptyText={emptyText}
      emptyAction={emptyAction}
    >
      {isDesktop ? <DataTable {...body} /> : <DataCards {...body} renderCard={renderCard} />}
      {pagination && <ListPagination {...pagination} />}
    </QueryState>
  );
};

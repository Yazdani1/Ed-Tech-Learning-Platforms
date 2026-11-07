'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { ResponsiveDataView } from '@/components/common/ResponsiveDataView';
import { useOrderSelectColumn } from '@/components/orders/useOrderSelectColumn';
import { useOrderColumns } from '@/components/orders/useOrderColumns';

import type { OrderSelection } from './useOrderSelection';
import type { Order } from '@/schemas/revenue.schema';
import type { ListResult } from '@/types';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

interface RevenueOrdersProps {
  orders: { data: ListResult<Order> | undefined; isPending: boolean; error: ApiError | null };
  onRetry: () => void;
  onPageChange: (page: number) => void;
  selection: OrderSelection;
  onOpen: (order: Order) => void;
}

/** Every sale of the filter, a tick box per row, 10 per page; a row opens its details. */
export const RevenueOrders: FC<RevenueOrdersProps> = ({
  orders,
  onRetry,
  onPageChange,
  selection,
  onOpen,
}) => {
  const { t } = useTranslation();
  const rows = orders.data?.items ?? [];
  const columns = [useOrderSelectColumn(selection), ...useOrderColumns({ showCourse: true })];
  const pageTicked = rows.length > 0 && rows.every((row) => selection.isSelected(row));

  return (
    <Paper sx={{ overflow: 'hidden', boxShadow: 2, borderRadius: 2 }}>
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        {rows.length > 0 && (
          <Button
            size="small"
            onClick={() => {
              selection.togglePage(rows);
            }}
            sx={{ mb: 1, minHeight: 44 }}
          >
            {t(pageTicked ? 'revenue.unselectPage' : 'revenue.selectPage')}
          </Button>
        )}
        <ResponsiveDataView
          isLoading={orders.isPending}
          error={orders.error}
          onRetry={onRetry}
          emptyText={t('revenue.empty')}
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          label={t('revenue.ordersLabel')}
          onRowClick={onOpen}
          pagination={
            orders.data && {
              page: orders.data.page,
              limit: orders.data.limit,
              total: orders.data.total,
              onPageChange,
            }
          }
        />
      </Box>
    </Paper>
  );
};

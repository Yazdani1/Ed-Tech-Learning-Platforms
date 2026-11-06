'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import { useTranslation } from 'react-i18next';

import { ResponsiveDataView, type DataColumn } from '@/components/common/ResponsiveDataView';
import { OrderTypeTabs } from '@/components/orders/OrderTypeTabs';
import { useOrderColumns } from '@/components/orders/useOrderColumns';

import type { OrderSelection } from './useOrderSelection';
import type { Order, OrderType } from '@/schemas/revenue.schema';
import type { ListResult } from '@/types';
import type { ApiError } from '@/services/http.service';
import type { FC } from 'react';

interface RevenueOrdersProps {
  type: OrderType;
  onTypeChange: (type: OrderType) => void;
  orders: { data: ListResult<Order> | undefined; isPending: boolean; error: ApiError | null };
  onRetry: () => void;
  onPageChange: (page: number) => void;
  selection: OrderSelection;
  onOpen: (order: Order) => void;
}

const CHECK_WIDTH = 56;

/** The tick box column (a click on it does not open the row). */
const useSelectColumn = (selection: OrderSelection): DataColumn<Order> => {
  const { t } = useTranslation();
  return {
    key: 'select',
    header: '',
    width: CHECK_WIDTH,
    render: (row) => (
      <Checkbox
        checked={selection.isSelected(row)}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onChange={() => {
          selection.toggle(row);
        }}
        slotProps={{ input: { 'aria-label': t('revenue.selectOrder', { id: row._id }) } }}
      />
    ),
  };
};

/** Every order (All / Paid / Free / Subscription), a tick box per row, 10 per page; a row opens its details. */
export const RevenueOrders: FC<RevenueOrdersProps> = ({
  type,
  onTypeChange,
  orders,
  onRetry,
  onPageChange,
  selection,
  onOpen,
}) => {
  const { t } = useTranslation();
  const rows = orders.data?.items ?? [];
  const columns = [useSelectColumn(selection), ...useOrderColumns({ showCourse: true })];
  const pageTicked = rows.length > 0 && rows.every((row) => selection.isSelected(row));

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <OrderTypeTabs value={type} onChange={onTypeChange} />
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

'use client';

import Checkbox from '@mui/material/Checkbox';
import { useTranslation } from 'react-i18next';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { OrderSelection } from '@/components/revenue/useOrderSelection';
import type { Order } from '@/schemas/revenue.schema';

const CHECK_WIDTH = 56;

/** The tick box column (a click on it does not open the row). */
export const useOrderSelectColumn = (selection: OrderSelection): DataColumn<Order> => {
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

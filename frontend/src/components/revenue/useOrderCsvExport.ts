'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { exportRevenueOrders, type OrderFilters } from '@/api/revenue.api';
import { toastError } from '@/utils/toast-error';

import { exportOrdersCsv } from './order-export';

import type { ExportChoice } from './ExportOrdersModal';
import type { Order } from '@/schemas/revenue.schema';

export interface OrderCsvExport {
  exportCsv: (choice: ExportChoice) => void;
  exporting: boolean;
}

/** The CSV of the ticked sales, or of every sale of the current filter (read from the server). */
export const useOrderCsvExport = (
  selected: readonly Order[],
  filters: OrderFilters,
  fileName: string,
  onDone: () => void,
): OrderCsvExport => {
  const { t, i18n } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const exportCsv = ({ scope, includeContact }: ExportChoice): void => {
    setExporting(true);
    const source =
      scope === 'selected' ? Promise.resolve([...selected]) : exportRevenueOrders(filters);
    source
      .then((orders) => {
        exportOrdersCsv(t, orders, i18n.language, { includeContact, fileName });
        toast.success(t('revenue.export.done', { count: orders.length }));
        onDone();
      })
      .catch(toastError)
      .finally(() => {
        setExporting(false);
      });
  };
  return { exportCsv, exporting };
};

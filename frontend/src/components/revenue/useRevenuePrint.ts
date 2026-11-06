'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { exportRevenueOrders, type OrderFilters } from '@/api/revenue.api';
import { openPrintWindow } from '@/utils/print-table';
import { toastError } from '@/utils/toast-error';

import { printStudents, type PdfField } from './order-export';

import type { PrintScope } from './PrintStudentsModal';
import type { Order } from '@/schemas/revenue.schema';

export interface RevenuePrint {
  print: (scope: PrintScope, fields: PdfField[]) => void;
  printing: boolean;
}

/**
 * The student print-out (saved as PDF from the print dialog): the ticked orders, or every order of the
 * current filter (course / type, read from the server).
 */
export const useRevenuePrint = (
  selected: readonly Order[],
  filters: OrderFilters,
  filterLabel: string,
  onDone: () => void,
): RevenuePrint => {
  const { t, i18n } = useTranslation();
  const [printing, setPrinting] = useState(false);
  const print = (scope: PrintScope, fields: PdfField[]): void => {
    // Opened inside the click, so the pop-up blocker lets it through
    const win = openPrintWindow(t('revenue.pdf.preparing'));
    if (!win) {
      toast.error(t('revenue.pdf.blocked'));
      return;
    }
    setPrinting(true);
    const source =
      scope === 'selected' ? Promise.resolve([...selected]) : exportRevenueOrders(filters);
    const title = scope === 'selected' ? t('revenue.pdf.selectedTitle') : filterLabel;
    source
      .then((orders) => {
        printStudents(t, win, orders, fields, title, i18n.language);
      })
      .then(() => {
        toast.success(t('revenue.pdf.done'));
        onDone();
      })
      .catch((error: unknown) => {
        win.close();
        toastError(error);
      })
      .finally(() => {
        setPrinting(false);
      });
  };
  return { print, printing };
};

'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import {
  exportOrdersCsv,
  printStudentTokens,
  type PdfField,
} from '@/components/revenue/order-export';
import { useModal, type ModalState } from '@/hooks/useModal';
import { openPrintWindow } from '@/utils/print-table';

import type { ExportChoice } from '@/components/revenue/ExportOrdersModal';
import type { PrintScope } from '@/components/revenue/PrintStudentsModal';
import type { Order } from '@/schemas/revenue.schema';

interface CourseOrderOutputs {
  exportModal: ModalState<undefined>;
  tokenModal: ModalState<undefined>;
  closeAll: () => void;
  exportCsv: (choice: ExportChoice) => void;
  printTokens: (scope: PrintScope, fields: PdfField[]) => void;
}

/**
 * The course page's CSV (every detail + totals with VAT) and student tokens (grid PDF), of the ticked rows or
 * of every row the filters show, with their two dialogs. Everything is already in the browser.
 */
export const useCourseOrderOutputs = (
  selected: readonly Order[],
  filtered: readonly Order[],
  courseTitle: string,
  fileName: string,
): CourseOrderOutputs => {
  const { t, i18n } = useTranslation();
  const exportModal = useModal();
  const tokenModal = useModal();
  const closeAll = (): void => {
    exportModal.closeModal();
    tokenModal.closeModal();
  };
  const rowsOf = (scope: PrintScope): readonly Order[] =>
    scope === 'selected' ? selected : filtered;
  return {
    exportModal,
    tokenModal,
    closeAll,
    exportCsv: ({ scope, includeContact }) => {
      const rows = rowsOf(scope);
      exportOrdersCsv(t, rows, i18n.language, { includeContact, fileName });
      toast.success(t('revenue.export.done', { count: rows.length }));
      closeAll();
    },
    printTokens: (scope, fields) => {
      const win = openPrintWindow(t('revenue.pdf.preparing'));
      if (!win) {
        toast.error(t('revenue.pdf.blocked'));
        return;
      }
      printStudentTokens(t, win, rowsOf(scope), fields, courseTitle, i18n.language);
      closeAll();
    },
  };
};

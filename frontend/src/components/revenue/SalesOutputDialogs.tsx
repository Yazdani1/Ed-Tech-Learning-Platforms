'use client';

import { ExportOrdersModal } from './ExportOrdersModal';
import { PrintStudentsModal } from './PrintStudentsModal';
import { useOrderCsvExport } from './useOrderCsvExport';
import { useRevenuePrint } from './useRevenuePrint';

import type { OrderSelection } from './useOrderSelection';
import type { OrderFilters } from '@/api/revenue.api';
import type { FC } from 'react';

interface DialogState {
  open: boolean;
  closeModal: () => void;
}

interface SalesOutputDialogsProps {
  printModal: DialogState;
  exportModal: DialogState;
  selection: OrderSelection;
  filters: OrderFilters;
  /** "All courses" or the chosen course(s) */
  courseLabel: string;
  fileName: string;
}

/** The students print-out and CSV export dialogs of the sales table (ticked sales or the whole filter). */
export const SalesOutputDialogs: FC<SalesOutputDialogsProps> = ({
  printModal,
  exportModal,
  selection,
  filters,
  courseLabel,
  fileName,
}) => {
  const pdf = useRevenuePrint(selection.selected, filters, courseLabel, printModal.closeModal);
  const csv = useOrderCsvExport(selection.selected, filters, fileName, exportModal.closeModal);
  const shared = { selectedCount: selection.selected.length, filterLabel: courseLabel };
  return (
    <>
      {printModal.open && (
        <PrintStudentsModal
          {...shared}
          onClose={printModal.closeModal}
          printing={pdf.printing}
          onPrint={pdf.print}
        />
      )}
      {exportModal.open && (
        <ExportOrdersModal
          {...shared}
          onClose={exportModal.closeModal}
          exporting={csv.exporting}
          onExport={csv.exportCsv}
        />
      )}
    </>
  );
};

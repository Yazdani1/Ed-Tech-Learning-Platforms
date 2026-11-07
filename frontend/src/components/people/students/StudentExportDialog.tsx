'use client';

import { useTranslation } from 'react-i18next';

import { ExportOrdersModal } from '@/components/revenue/ExportOrdersModal';

import { useStudentExport } from './useStudentExport';

import type { StudentFilters } from '@/api/students.api';
import type { StudentRow } from '@/schemas/students.schema';
import type { FC } from 'react';

interface StudentExportDialogProps {
  /** (Mounted only while open.) */
  onClose: () => void;
  selected: readonly StudentRow[];
  filters: StudentFilters;
  /** How many students the filters match */
  total: number;
}

/** Super Admin: CSV of the ticked students or of every student of the filters (email and phone included by default). */
export const StudentExportDialog: FC<StudentExportDialogProps> = ({
  onClose,
  selected,
  filters,
  total,
}) => {
  const { t } = useTranslation();
  const studentExport = useStudentExport(selected, filters, onClose);
  return (
    <ExportOrdersModal
      onClose={onClose}
      selectedCount={selected.length}
      filterLabel=""
      selectedText={t('people.students.exportSelected', { count: selected.length })}
      filterText={t('people.students.exportFiltered', { count: total })}
      exporting={studentExport.exporting}
      defaultIncludeContact
      onExport={studentExport.run}
    />
  );
};

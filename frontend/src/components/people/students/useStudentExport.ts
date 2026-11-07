'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { exportStudents, type StudentFilters } from '@/api/students.api';
import { toastError } from '@/utils/toast-error';

import { exportStudentsCsv } from './student-export';

import type { ExportChoice } from '@/components/revenue/ExportOrdersModal';
import type { StudentRow } from '@/schemas/students.schema';

interface StudentExport {
  run: (choice: ExportChoice) => void;
  exporting: boolean;
}

/** The students CSV (Super Admin): the ticked students, or every student of the filters (read from the server). */
export const useStudentExport = (
  selected: readonly StudentRow[],
  filters: StudentFilters,
  onDone: () => void,
): StudentExport => {
  const { t, i18n } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const run = ({ scope, includeContact }: ExportChoice): void => {
    setExporting(true);
    const source = scope === 'selected' ? Promise.resolve([...selected]) : exportStudents(filters);
    source
      .then((rows) => {
        exportStudentsCsv(t, rows, i18n.language, includeContact);
        toast.success(t('people.students.exported', { count: rows.length }));
        onDone();
      })
      .catch(toastError)
      .finally(() => {
        setExporting(false);
      });
  };
  return { run, exporting };
};

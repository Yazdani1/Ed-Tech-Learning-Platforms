'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { toastError } from '@/utils/toast-error';

import { exportUsersCsv, fetchAllUsers } from './user-export';

import type { ExportChoice } from '@/components/revenue/ExportOrdersModal';
import type { ManagedUser } from '@/schemas/people.schema';

interface UserExport {
  run: (choice: ExportChoice) => void;
  exporting: boolean;
}

/** The users CSV: the ticked users, or every user of the current filters (read page by page). */
export const useUserExport = (
  selected: readonly ManagedUser[],
  query: Record<string, string | number>,
  onDone: () => void,
): UserExport => {
  const { t, i18n } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const run = ({ scope }: ExportChoice): void => {
    setExporting(true);
    const source = scope === 'selected' ? Promise.resolve([...selected]) : fetchAllUsers(query);
    source
      .then((users) => {
        exportUsersCsv(t, users, i18n.language);
        toast.success(t('people.users.exported', { count: users.length }));
        onDone();
      })
      .catch(toastError)
      .finally(() => {
        setExporting(false);
      });
  };
  return { run, exporting };
};

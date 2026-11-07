'use client';

import { useTranslation } from 'react-i18next';

import { ExportOrdersModal } from '@/components/revenue/ExportOrdersModal';

import { BlockUserModal } from './BlockUserModal';
import { UserDetailsModal } from './UserDetailsModal';
import { UserFormModal } from './UserFormModal';
import { UserHistoryModal } from './UserHistoryModal';
import { useUserExport } from './useUserExport';

import type { UserDialogs } from './useUserDialogs';
import type { ManagedUser } from '@/schemas/people.schema';
import type { FC } from 'react';

interface UserDialogsViewProps {
  dialogs: UserDialogs;
  selected: readonly ManagedUser[];
  /** GET /api/users query of the current filters (for "export every user of the filters") */
  query: Record<string, string | number>;
  total: number;
}

/** Renders whichever user dialog is open. */
export const UserDialogsView: FC<UserDialogsViewProps> = ({ dialogs, selected, query, total }) => {
  const { t } = useTranslation();
  const { form, block, history, details, exportCsv } = dialogs;
  const userExport = useUserExport(selected, query, exportCsv.closeModal);
  return (
    <>
      <UserFormModal open={form.open} user={form.data} onClose={form.closeModal} />
      {block.open && block.data && <BlockUserModal user={block.data} onClose={block.closeModal} />}
      {history.open && history.data && (
        <UserHistoryModal user={history.data} onClose={history.closeModal} />
      )}
      <UserDetailsModal open={details.open} user={details.data} onClose={details.closeModal} />
      {exportCsv.open && (
        <ExportOrdersModal
          onClose={exportCsv.closeModal}
          selectedCount={selected.length}
          filterLabel=""
          selectedText={t('people.users.exportSelected', { count: selected.length })}
          filterText={t('people.users.exportFiltered', { count: total })}
          exporting={userExport.exporting}
          hideContactOption
          onExport={userExport.run}
        />
      )}
    </>
  );
};

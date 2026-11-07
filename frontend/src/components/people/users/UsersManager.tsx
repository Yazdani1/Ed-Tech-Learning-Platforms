'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { useUsers } from '@/api/people.api';
import { PageHeader } from '@/components/common/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { countUserFilters, toUserQuery, usePeopleUserParams } from '@/hooks/usePeopleUserParams';
import { useRowSelection } from '@/hooks/useRowSelection';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { UserDialogsView } from './UserDialogsView';
import { UsersFilterPanel } from './UsersFilterPanel';
import { UsersHeaderActions } from './UsersHeaderActions';
import { UsersList } from './UsersList';
import { useUserDialogs } from './useUserDialogs';

import type { ManagedUser } from '@/schemas/people.schema';

/** The user list: filters, tick boxes, CSV export, paging and dialogs (create, edit, block, history, details). */
export const UsersManager = () => {
  const { t } = useTranslation();
  const isSuperAdmin = useAuth().hasRole(SUPER_ADMIN_ROLES);
  const { params, setParams } = usePeopleUserParams();
  const userQuery = toUserQuery(params, isSuperAdmin);
  const query = useUsers(userQuery);
  const dialogs = useUserDialogs();
  const selection = useRowSelection<ManagedUser>();
  const activeCount = countUserFilters(params, isSuperAdmin);

  return (
    <Box>
      <PageHeader
        title={t('people.users.title')}
        count={query.data?.total}
        actions={
          <UsersHeaderActions
            selectedCount={selection.selected.length}
            onClearSelection={selection.clear}
            onExport={() => {
              dialogs.exportCsv.openModal();
            }}
            onCreate={() => {
              dialogs.form.openModal();
            }}
          />
        }
      />
      <UsersFilterPanel
        params={params}
        onChange={setParams}
        isSuperAdmin={isSuperAdmin}
        activeCount={activeCount}
        resultCount={query.data?.total}
        totalUsers={query.data?.totalUsers}
      />
      <UsersList
        selection={selection}
        query={query}
        hasFilters={activeCount > 0}
        onAction={dialogs.onAction}
        onPageChange={(page) => {
          setParams({ page });
        }}
      />
      <UserDialogsView
        dialogs={dialogs}
        selected={selection.selected}
        query={userQuery}
        total={query.data?.total ?? 0}
      />
    </Box>
  );
};

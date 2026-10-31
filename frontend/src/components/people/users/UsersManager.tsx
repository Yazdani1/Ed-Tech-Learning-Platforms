'use client';

import Box from '@mui/material/Box';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useUsers } from '@/api/people.api';
import { PageHeader } from '@/components/common/PageHeader';
import { AddButton } from '@/components/people/common/AddButton';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/hooks/useModal';
import { countUserFilters, toUserQuery, usePeopleUserParams } from '@/hooks/usePeopleUserParams';
import { SUPER_ADMIN_ROLES } from '@/utils/roles';

import { UserDetailsModal } from './UserDetailsModal';
import { UserFormModal } from './UserFormModal';
import { UserRoleModal } from './UserRoleModal';
import { UsersFilterPanel } from './UsersFilterPanel';
import { UsersList } from './UsersList';

import type { UserAction } from './UserRowMenu';
import type { ManagedUser } from '@/schemas/people.schema';

/** The user list with its filters, paging and dialogs (create, edit, change role, details). */
export const UsersManager = () => {
  const { t } = useTranslation();
  const isSuperAdmin = useAuth().hasRole(SUPER_ADMIN_ROLES);
  const { params, setParams } = usePeopleUserParams();
  const query = useUsers(toUserQuery(params, isSuperAdmin));
  const formModal = useModal<ManagedUser>();
  const roleModal = useModal<ManagedUser>();
  const detailsModal = useModal<ManagedUser>();
  const activeCount = countUserFilters(params, isSuperAdmin);

  const onAction = useCallback(
    (action: UserAction, user: ManagedUser) => {
      const modal = { edit: formModal, role: roleModal, details: detailsModal }[action];
      modal.openModal(user);
    },
    [formModal, roleModal, detailsModal],
  );

  return (
    <Box>
      <PageHeader
        title={t('people.users.title')}
        actions={
          <AddButton
            label={t('people.users.create')}
            onClick={() => {
              formModal.openModal();
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
        query={query}
        hasFilters={activeCount > 0}
        onAction={onAction}
        onPageChange={(page) => {
          setParams({ page });
        }}
      />
      <UserFormModal open={formModal.open} user={formModal.data} onClose={formModal.closeModal} />
      <UserRoleModal open={roleModal.open} user={roleModal.data} onClose={roleModal.closeModal} />
      <UserDetailsModal
        open={detailsModal.open}
        user={detailsModal.data}
        onClose={detailsModal.closeModal}
      />
    </Box>
  );
};

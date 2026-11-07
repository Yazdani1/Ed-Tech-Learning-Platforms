'use client';

import { useTranslation } from 'react-i18next';

import { useUserHistory } from '@/api/people.api';
import { AppModal } from '@/components/common/AppModal';
import { AuditHistoryList } from '@/components/common/AuditHistoryList';
import { auditValue, type AuditEntry } from '@/schemas/audit.schema';

import { ROLE_KEY } from './user-utils';

import type { ManagedUser } from '@/schemas/people.schema';
import type { UserRole } from '@/types';
import type { FC } from 'react';

interface UserHistoryModalProps {
  /** (Mounted only while open.) */
  user: ManagedUser;
  onClose: () => void;
}

/** Every role change and block / unblock of the user: what, who and when (newest first). */
export const UserHistoryModal: FC<UserHistoryModalProps> = ({ user, onClose }) => {
  const { t } = useTranslation();
  const history = useUserHistory(user._id);
  const roleName = (role: string): string =>
    role in ROLE_KEY ? t(`people.roles.${ROLE_KEY[role as UserRole]}`) : role;
  const describe = (entry: AuditEntry): string => {
    if (entry.action === 'user.role')
      return t('people.users.history.role', {
        from: roleName(auditValue(entry.before, 'role')),
        to: roleName(auditValue(entry.after, 'role')),
      });
    return t(
      entry.action === 'user.block'
        ? 'people.users.history.blocked'
        : 'people.users.history.unblocked',
    );
  };
  return (
    <AppModal
      open
      onClose={onClose}
      title={t('people.users.history.title', { name: user.name })}
      hideActions
    >
      <AuditHistoryList
        entries={history.data}
        isPending={history.isPending}
        error={history.error}
        onRetry={() => void history.refetch()}
        describe={describe}
        label={t('people.users.history.title', { name: user.name })}
      />
    </AppModal>
  );
};

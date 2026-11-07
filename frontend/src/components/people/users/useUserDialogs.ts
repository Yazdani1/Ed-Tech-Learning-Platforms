'use client';

import { useCallback } from 'react';

import { useModal, type ModalState } from '@/hooks/useModal';

import type { UserAction } from './UserRowMenu';
import type { ManagedUser } from '@/schemas/people.schema';

export interface UserDialogs {
  form: ModalState<ManagedUser>;
  block: ModalState<ManagedUser>;
  history: ModalState<ManagedUser>;
  details: ModalState<ManagedUser>;
  exportCsv: ModalState<undefined>;
  /** The row menu's choice opens its dialog */
  onAction: (action: UserAction, user: ManagedUser) => void;
}

/** The dialogs of the user list (create / edit, block, history, details, CSV export). */
export const useUserDialogs = (): UserDialogs => {
  const form = useModal<ManagedUser>();
  const block = useModal<ManagedUser>();
  const history = useModal<ManagedUser>();
  const details = useModal<ManagedUser>();
  const exportCsv = useModal();
  const onAction = useCallback(
    (action: UserAction, user: ManagedUser) => {
      ({ edit: form, block, history, details })[action].openModal(user);
    },
    [form, block, history, details],
  );
  return { form, block, history, details, exportCsv, onAction };
};

'use client';

import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmContext, type ConfirmFn } from '@/context/ConfirmContext';

/** `await confirm({ title, message })` is true when the user confirmed. Needs ConfirmProvider (providers.tsx). */
export const useConfirm = (): ConfirmFn => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside ConfirmProvider');
  return confirm;
};

/** `await confirmDelete(name)` asks "Delete <name>? This cannot be undone." with a red button. */
export const useDeleteConfirm = (): ((itemName: string) => Promise<boolean>) => {
  const confirm = useConfirm();
  const { t } = useTranslation();
  return (itemName) =>
    confirm({
      title: t('common.deleteTitle'),
      message: t('common.deleteMessage', { name: itemName }),
      confirmLabel: t('common.delete'),
      destructive: true,
    });
};

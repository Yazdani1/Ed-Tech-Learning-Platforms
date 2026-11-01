'use client';

import { useTranslation } from 'react-i18next';

import { useConfirm } from '@/hooks/useConfirm';

/** `await confirmArchive(name)`: "Archive <name>? It is hidden from the Community Hub." with a red button. */
export const useArchiveConfirm = (): ((name: string) => Promise<boolean>) => {
  const confirm = useConfirm();
  const { t } = useTranslation();
  return (name) =>
    confirm({
      title: t('community.admin.archiveTitle'),
      message: t('community.admin.archiveMessage', { name }),
      confirmLabel: t('community.admin.archive'),
      destructive: true,
    });
};

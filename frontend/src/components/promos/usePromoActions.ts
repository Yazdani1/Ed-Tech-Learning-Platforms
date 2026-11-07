'use client';

import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeletePromo, useSavePromo } from '@/api/promos.api';
import { useConfirm, useDeleteConfirm } from '@/hooks/useConfirm';

import type { Promo } from '@/schemas/promo.schema';

/**
 * Switch a promo on / off (always asks first; each switch is kept in its history) and delete it (asks first;
 * the server refuses a used one with a message).
 */
export const usePromoActions = () => {
  const { t } = useTranslation();
  const save = useSavePromo();
  const remove = useDeletePromo();
  const confirm = useConfirm();
  const confirmDelete = useDeleteConfirm();
  return {
    onToggle: async (promo: Promo): Promise<void> => {
      const ok = await confirm({
        title: t(promo.isActive ? 'promos.confirmOffTitle' : 'promos.confirmOnTitle', {
          title: promo.title,
        }),
        message: t(promo.isActive ? 'promos.confirmOffMessage' : 'promos.confirmOnMessage'),
        confirmLabel: t(promo.isActive ? 'coupons.deactivate' : 'coupons.activate'),
        destructive: promo.isActive,
      });
      if (!ok) return;
      save.mutate(
        { id: promo._id, body: { isActive: !promo.isActive } },
        {
          onSuccess: () => toast.success(t(promo.isActive ? 'promos.stopped' : 'promos.resumed')),
          onError: (error) => toast.error(error.message),
        },
      );
    },
    onDelete: (promo: Promo): void => {
      void confirmDelete(promo.title).then((ok) => {
        if (!ok) return;
        remove.mutate(promo._id, {
          onSuccess: () => toast.success(t('promos.deleted')),
          onError: (error) => toast.error(error.message),
        });
      });
    },
  };
};

'use client';

import { useTranslation } from 'react-i18next';

import { usePromoHistory } from '@/api/promos.api';
import { AppModal } from '@/components/common/AppModal';
import { AuditHistoryList } from '@/components/common/AuditHistoryList';

import type { Promo } from '@/schemas/promo.schema';
import type { FC } from 'react';

interface PromoHistoryModalProps {
  /** (Mounted only while open.) */
  promo: Promo;
  onClose: () => void;
}

/** Who switched the promo on or off and when (newest first). */
export const PromoHistoryModal: FC<PromoHistoryModalProps> = ({ promo, onClose }) => {
  const { t } = useTranslation();
  const history = usePromoHistory(promo._id);
  const title = t('promos.history.title', { title: promo.title });
  return (
    <AppModal open onClose={onClose} title={title} hideActions>
      <AuditHistoryList
        entries={history.data}
        isPending={history.isPending}
        error={history.error}
        onRetry={() => void history.refetch()}
        label={title}
        describe={(entry) =>
          t(entry.after?.isActive === true ? 'promos.history.on' : 'promos.history.off')
        }
      />
    </AppModal>
  );
};

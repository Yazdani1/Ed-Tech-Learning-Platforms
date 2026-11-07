'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useDeletePromoDesign, usePromoDesign, useUploadPromoDesign } from '@/api/promos.api';
import { QueryState } from '@/components/common/QueryState';
import { useConfirm } from '@/hooks/useConfirm';

import { PromoDesignSlotCard } from './PromoDesignSlotCard';

import type { PromoDesignSlot } from '@/schemas/promo.schema';

const SLOTS: Record<PromoDesignSlot, { aspectRatio: string; maxPreviewWidth: number }> = {
  banner: { aspectRatio: '8 / 1', maxPreviewWidth: 960 },
  popup: { aspectRatio: '3 / 4', maxPreviewWidth: 300 },
};

/**
 * Promos page, Design tab: a custom picture for the top banner and one for the centre pop-up of a running
 * promo (the countdown and code are shown on top of it). Without a picture the default design is used.
 */
export const PromoDesignTab = () => {
  const { t } = useTranslation();
  const design = usePromoDesign();
  const upload = useUploadPromoDesign();
  const remove = useDeletePromoDesign();
  const confirm = useConfirm();
  const busy = upload.isPending || remove.isPending;

  const onFile = (slot: PromoDesignSlot, file: File): void => {
    upload.mutate({ slot, file }, { onSuccess: () => toast.success(t('promos.design.saved')) });
  };
  const onRemove = async (slot: PromoDesignSlot): Promise<void> => {
    const ok = await confirm({
      title: t('promos.design.removeTitle'),
      message: t('promos.design.removeMessage'),
      confirmLabel: t('promos.design.useDefault'),
    });
    if (ok) remove.mutate(slot, { onSuccess: () => toast.success(t('promos.design.removed')) });
  };

  return (
    <QueryState
      isLoading={design.isPending}
      error={design.error}
      onRetry={() => void design.refetch()}
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('promos.design.info')}
      </Alert>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {(Object.keys(SLOTS) as PromoDesignSlot[]).map((slot) => (
          <PromoDesignSlotCard
            key={slot}
            title={t(`promos.design.${slot}.title`)}
            hint={t(`promos.design.${slot}.hint`)}
            imageUrl={
              slot === 'banner' ? (design.data?.bannerImage ?? '') : (design.data?.popupImage ?? '')
            }
            {...SLOTS[slot]}
            busy={busy}
            error={upload.variables?.slot === slot ? upload.error?.message : null}
            onFile={(file) => {
              onFile(slot, file);
            }}
            onRemove={() => void onRemove(slot)}
          />
        ))}
      </Box>
    </QueryState>
  );
};

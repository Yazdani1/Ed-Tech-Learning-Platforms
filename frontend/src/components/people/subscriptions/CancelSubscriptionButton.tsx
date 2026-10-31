'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { useCancelMemberSubscription } from '@/api/people.api';
import { toastError } from '@/utils/toast-error';
import { useConfirm } from '@/hooks/useConfirm';

import type { SubscriptionRecord } from '@/schemas/people.schema';
import type { FC } from 'react';

interface CancelSubscriptionButtonProps {
  record: SubscriptionRecord;
}

/** Cancels an active subscription after confirmation. */
export const CancelSubscriptionButton: FC<CancelSubscriptionButtonProps> = ({ record }) => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const cancel = useCancelMemberSubscription();
  const name = record.user?.name ?? t('people.subscriptions.deletedUser');

  const handleCancel = async (): Promise<void> => {
    const confirmed = await confirm({
      title: t('people.subscriptions.cancelTitle'),
      message: t('people.subscriptions.cancelMessage', { name, plan: record.plan }),
      confirmLabel: t('people.subscriptions.cancelConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    void cancel
      .mutateAsync(record._id)
      .then(() => toast.success(t('people.subscriptions.cancelled')))
      .catch(toastError);
  };

  return (
    <IconButton
      color="error"
      aria-label={t('people.subscriptions.cancelFor', { name })}
      onClick={() => void handleCancel()}
      disabled={cancel.isPending}
      sx={{ width: 44, height: 44 }}
    >
      <CancelIcon />
    </IconButton>
  );
};

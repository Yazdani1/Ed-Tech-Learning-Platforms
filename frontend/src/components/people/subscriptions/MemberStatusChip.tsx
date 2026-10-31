'use client';

import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { STATUS_COLOR, STATUS_KEY, effectiveStatus } from './plan-utils';

import type { SubscriptionRecord } from '@/schemas/people.schema';
import type { FC } from 'react';

interface MemberStatusChipProps {
  record: SubscriptionRecord;
}

/** Active / Cancelled / Expired (an active record past its end date shows as expired). */
export const MemberStatusChip: FC<MemberStatusChipProps> = ({ record }) => {
  const { t } = useTranslation();
  const status = effectiveStatus(record);
  return (
    <Chip
      label={t(`people.subscriptions.status.${STATUS_KEY[status]}`)}
      size="small"
      color={STATUS_COLOR[status]}
    />
  );
};

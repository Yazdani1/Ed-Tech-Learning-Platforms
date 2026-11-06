'use client';

import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import type { CouponStatus } from '@/schemas/coupon.schema';
import type { FC } from 'react';

interface CouponStatusChipProps {
  status: CouponStatus;
}

const COLORS: Record<CouponStatus, 'success' | 'info' | 'default' | 'warning' | 'error'> = {
  active: 'success',
  scheduled: 'info',
  expired: 'default',
  inactive: 'warning',
  'used-up': 'error',
};

/** Active / Scheduled / Expired / Inactive / Used up. */
export const CouponStatusChip: FC<CouponStatusChipProps> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <Chip
      label={t(`coupons.status.${status}`)}
      color={COLORS[status]}
      size="small"
      variant={status === 'active' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 700 }}
    />
  );
};

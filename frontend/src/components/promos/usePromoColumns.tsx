'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { discountLabel, periodLabel } from '@/components/coupons/coupon-format';
import { CouponRowMenu } from '@/components/coupons/CouponRowMenu';
import { CouponStatusChip } from '@/components/coupons/CouponStatusChip';
import { RemainingTime } from '@/components/coupons/RemainingTime';
import { MONO_FONT } from '@/theme/fonts';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { Promo } from '@/schemas/promo.schema';
import type { TFunction } from 'i18next';

interface PromoRowActions {
  onEdit: (promo: Promo) => void;
  onToggle: (promo: Promo) => void | Promise<void>;
  onDelete: (promo: Promo) => void;
  onHistory: (promo: Promo) => void;
}

const ACTIONS_WIDTH = 64;

const remainingColumn = (t: TFunction): DataColumn<Promo> => ({
  key: 'remaining',
  header: t('coupons.remaining.header'),
  render: (row) => (
    <RemainingTime startsAt={row.startsAt} endsAt={row.endsAt} isActive={row.isActive} />
  ),
});

const actionsColumn = (t: TFunction, actions: PromoRowActions): DataColumn<Promo> => ({
  key: 'actions',
  header: '',
  align: 'right',
  width: ACTIONS_WIDTH,
  render: (row) => (
    <CouponRowMenu
      label={t('promos.actionsFor', { title: row.title })}
      isActive={row.isActive}
      onEdit={() => {
        actions.onEdit(row);
      }}
      onToggle={() => {
        void actions.onToggle(row);
      }}
      onDelete={() => {
        actions.onDelete(row);
      }}
      onHistory={() => {
        actions.onHistory(row);
      }}
    />
  ),
});

/** Promo list columns: title and code, discount, dates, time left, courses, uses, status, the row menu. */
export const usePromoColumns = (actions: PromoRowActions): DataColumn<Promo>[] => {
  const { t, i18n } = useTranslation();
  return [
    {
      key: 'title',
      header: t('promos.fields.title'),
      render: (row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {row.title}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: MONO_FONT }}>
            {row.code}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'discount',
      header: t('coupons.discount'),
      render: (row) => discountLabel(t, row.discountType, row.value),
    },
    {
      key: 'period',
      header: t('coupons.periodHeader'),
      render: (row) => periodLabel(t, row.startsAt, row.endsAt, i18n.language),
    },
    remainingColumn(t),
    { key: 'courses', header: t('promos.coursesHeader'), render: (row) => row.courses.length },
    { key: 'used', header: t('coupons.students'), render: (row) => row.usedCount },
    {
      key: 'status',
      header: t('coupons.statusHeader'),
      render: (row) => <CouponStatusChip status={row.status} />,
    },
    actionsColumn(t, actions),
  ];
};

'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { MONO_FONT } from '@/theme/fonts';

import { discountLabel, periodLabel } from './coupon-format';
import { CouponRowMenu } from './CouponRowMenu';
import { CouponStatusChip } from './CouponStatusChip';
import { RemainingTime } from './RemainingTime';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { CourseCoupon } from '@/schemas/coupon.schema';
import type { TFunction } from 'i18next';

export interface CouponRowActions {
  onEdit: (coupon: CourseCoupon) => void;
  onToggle: (coupon: CourseCoupon) => void | Promise<void>;
  onDelete: (coupon: CourseCoupon) => void;
}

const ACTIONS_WIDTH = 64;
const KIND_COLOR = { auto: 'primary', promo: 'secondary', coupon: 'default' } as const;

/** Code with a chip saying where it comes from (course discount, coupon, promo). */
const codeColumn = (t: TFunction): DataColumn<CourseCoupon> => ({
  key: 'code',
  header: t('coupons.code'),
  render: (row) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Typography sx={{ fontFamily: MONO_FONT, fontWeight: 700 }}>{row.code}</Typography>
      <Chip
        label={t(`coupons.kind.${row.kind}`)}
        size="small"
        color={KIND_COLOR[row.kind]}
        variant="outlined"
      />
    </Box>
  ),
});

/** Columns of a course's codes: code and where it comes from, discount, dates, uses, status, actions. */
export const useCouponColumns = (actions: CouponRowActions): DataColumn<CourseCoupon>[] => {
  const { t, i18n } = useTranslation();
  return [
    codeColumn(t),
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
    {
      key: 'remaining',
      header: t('coupons.remaining.header'),
      render: (row) => (
        <RemainingTime startsAt={row.startsAt} endsAt={row.endsAt} isActive={row.isActive} />
      ),
    },
    {
      key: 'uses',
      header: t('coupons.students'),
      render: (row) =>
        row.usageLimit
          ? t('coupons.usesOfLimit', { used: row.usedCount, limit: row.usageLimit })
          : t('coupons.usesUnlimited', { used: row.usedCount }),
    },
    {
      key: 'status',
      header: t('coupons.statusHeader'),
      render: (row) => <CouponStatusChip status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: ACTIONS_WIDTH,
      // The course discount is edited on the Pricing page; promos on the Promos page
      render: (row) =>
        row.kind === 'coupon' ? (
          <CouponRowMenu
            label={t('coupons.actionsFor', { code: row.code })}
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
          />
        ) : null,
    },
  ];
};

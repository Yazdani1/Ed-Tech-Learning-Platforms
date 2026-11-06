'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';

import { ENROLLMENT_TYPE_COLOR } from '@/components/enrollments/enrollment-display';
import { DetailItem } from '@/components/people/common/DetailItem';
import { formatBdt } from '@/utils/price';

import { discountText } from './order-columns';
import { couponLabel, paymentMethodLabel } from './order-format';

import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface OrderPaymentDetailsProps {
  order: Order;
}

export const ORDER_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
  gap: 1.5,
} as const;

/** The money part of a purchase: type, list price, discount, paid, coupon and where it came from, method. */
export const OrderPaymentDetails: FC<OrderPaymentDetailsProps> = ({ order }) => {
  const { t } = useTranslation();
  const r = (key: string): string => t(`revenue.details.${key}`);
  const source = order.couponSource === 'course' ? 'auto' : order.couponSource;
  return (
    <Box sx={ORDER_GRID_SX}>
      <DetailItem
        label={r('type')}
        value={
          <Chip
            label={t(`revenue.types.${order.enrollmentType}`)}
            color={ENROLLMENT_TYPE_COLOR[order.enrollmentType]}
            size="small"
          />
        }
      />
      <DetailItem label={r('listPrice')} value={formatBdt(order.listPrice)} />
      <DetailItem label={r('discount')} value={discountText(order)} />
      <DetailItem label={r('amountPaid')} value={formatBdt(order.paidPrice)} />
      <DetailItem label={r('coupon')} value={couponLabel(order)} />
      <DetailItem label={r('couponSource')} value={source ? t(`coupons.kind.${source}`) : '—'} />
      <DetailItem label={r('paymentMethod')} value={paymentMethodLabel(t, order)} />
      <DetailItem label={r('currency')} value={order.currency} />
    </Box>
  );
};

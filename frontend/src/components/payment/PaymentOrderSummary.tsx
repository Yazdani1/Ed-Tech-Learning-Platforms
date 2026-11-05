'use client';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { useTranslation } from 'react-i18next';

import { formatBdt, getCoursePriceInfo, localizeDigits } from '@/utils/price';

import { PaymentCourseHeader } from './PaymentCourseHeader';
import { PAYMENT_CARD_SX } from './payment-methods';
import { PaymentPayAction } from './PaymentPayAction';
import { PaymentPriceRow } from './PaymentPriceRow';
import { PaymentTotal } from './PaymentTotal';

import type { Course } from '@/schemas/browse.schema';
import type { FC } from 'react';

interface PaymentOrderSummaryProps {
  course: Course;
}

/** Right side of the payment page: the course, the price lines, the total and the pay button. */
export const PaymentOrderSummary: FC<PaymentOrderSummaryProps> = ({ course }) => {
  const { t, i18n } = useTranslation();
  const price = getCoursePriceInfo(course);
  const money = (value: number): string => localizeDigits(formatBdt(value), i18n.language);

  return (
    <Box
      component="section"
      aria-label={t('payment.summaryLabel')}
      sx={{ ...PAYMENT_CARD_SX, p: { xs: 2, sm: 2.5 } }}
    >
      <PaymentCourseHeader course={course} />
      <Divider sx={{ mb: 2 }} />
      <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.25, mb: 2 }}>
        <PaymentPriceRow label={t('payment.regularPrice')}>
          <Box component={price.hasDiscount ? 's' : 'span'} sx={{ color: '#475569' }}>
            {money(price.listPrice)}
          </Box>
        </PaymentPriceRow>
        {price.hasDiscount && (
          <PaymentPriceRow label={t('payment.discount')}>
            <Box component="span" sx={{ color: '#047857', fontWeight: 600 }}>
              - {money(price.discountAmount)}
            </Box>
          </PaymentPriceRow>
        )}
        <PaymentPriceRow label={t('payment.platformAccess')}>
          <Box component="span" sx={{ color: '#047857', fontWeight: 600 }}>
            {t('payment.freeLabel')}
          </Box>
        </PaymentPriceRow>
      </Box>
      <PaymentTotal price={price} />
      <PaymentPayAction course={course} />
    </Box>
  );
};

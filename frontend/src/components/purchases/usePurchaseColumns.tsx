'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { ENROLLMENT_TYPE_COLOR, MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { MONO_FONT } from '@/theme/fonts';
import { formatDateTime } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { Purchase } from '@/schemas/purchase.schema';
import type { TFunction } from 'i18next';

const NO_VALUE = '—';

const courseColumn = (t: TFunction): DataColumn<Purchase> => ({
  key: 'course',
  header: t('purchases.columns.course'),
  render: (row) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
        {row.course?.title ?? t('purchases.deletedCourse')}
      </Typography>
      {row.course?.batchNumber && (
        <Typography variant="caption" color="text.secondary">
          {t('purchases.batch', { batch: row.course.batchNumber })}
        </Typography>
      )}
    </Box>
  ),
});

const mono = (text: string) => (
  <Box component="span" sx={{ fontFamily: MONO_FONT, fontSize: 12, overflowWrap: 'anywhere' }}>
    {text}
  </Box>
);

const discountText = (row: Purchase): string =>
  row.discountAmount > 0
    ? `${formatBdt(row.discountAmount)} (${String(Math.round(row.discountPercent))}%)`
    : NO_VALUE;

/** Purchase list columns: course, purchase ID, date, type, list price, discount, coupon, paid, method. */
export const usePurchaseColumns = (): DataColumn<Purchase>[] => {
  const { t, i18n } = useTranslation();
  const p = (key: string): string => t(`purchases.columns.${key}`);
  return [
    courseColumn(t),
    { key: 'id', header: p('purchaseId'), render: (row) => mono(row._id) },
    {
      key: 'date',
      header: p('date'),
      render: (row) => formatDateTime(row.createdAt, i18n.language),
    },
    {
      key: 'type',
      header: p('type'),
      render: (row) => (
        <Chip
          size="small"
          variant="outlined"
          color={ENROLLMENT_TYPE_COLOR[row.enrollmentType]}
          label={t(`revenue.types.${row.enrollmentType}`)}
        />
      ),
    },
    {
      key: 'list',
      header: p('listPrice'),
      render: (row) => (row.listPrice > 0 ? formatBdt(row.listPrice) : NO_VALUE),
    },
    { key: 'discount', header: p('discount'), render: discountText },
    { key: 'coupon', header: p('coupon'), render: (row) => mono(row.couponCode ?? NO_VALUE) },
    {
      key: 'paid',
      header: p('amountPaid'),
      render: (row) => (
        <Box component="span" sx={{ fontWeight: 700, color: MONEY_COLOR, whiteSpace: 'nowrap' }}>
          {formatBdt(row.amountPaid)}
        </Box>
      ),
    },
    {
      key: 'method',
      header: p('paymentMethod'),
      render: (row) =>
        t(row.paymentMethod ? `revenue.method.${row.paymentMethod}` : 'revenue.method.none'),
    },
  ];
};

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { ENROLLMENT_TYPE_COLOR, MONEY_COLOR } from '@/components/enrollments/enrollment-display';
import { StudentCell } from '@/components/enrollments/StudentCell';
import { MONO_FONT } from '@/theme/fonts';
import { formatDateTime } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import { couponLabel, orNone, paymentMethodLabel } from './order-format';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { Order } from '@/schemas/revenue.schema';
import type { TFunction } from 'i18next';

// The order list columns, built in parts (useOrderColumns puts them together).

const NOWRAP_MONO = { fontFamily: MONO_FONT, whiteSpace: 'nowrap' } as const;

export const discountText = (order: Order): string =>
  order.discountAmount > 0
    ? `${formatBdt(order.discountAmount)} (${String(Math.round(order.discountPercent))}%)`
    : '—';

/** "15% · ৳150" (VAT included in what was paid); a dash for orders without VAT. */
export const vatText = (order: Order): string =>
  order.vatAmount > 0 ? `${String(order.vatPercent)}% · ${formatBdt(order.vatAmount)}` : '—';

export const courseColumn = (t: TFunction): DataColumn<Order> => ({
  key: 'course',
  header: t('revenue.columns.course'),
  render: (row) => (
    <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
      {row.course?.title ?? t('revenue.deletedCourse')}
    </Typography>
  ),
});

/** Student, student ID and enrolment type. */
export const buyerColumns = (t: TFunction): DataColumn<Order>[] => [
  {
    key: 'student',
    header: t('revenue.columns.student'),
    render: (row) => <StudentCell student={row.student} />,
  },
  {
    key: 'studentNumber',
    header: t('revenue.columns.studentNumber'),
    render: (row) => (
      <Box component="span" sx={NOWRAP_MONO}>
        {orNone(row.student?.studentNumber)}
      </Box>
    ),
  },
  {
    key: 'type',
    header: t('revenue.columns.type'),
    render: (row) => (
      <Chip
        label={t(`revenue.types.${row.enrollmentType}`)}
        color={ENROLLMENT_TYPE_COLOR[row.enrollmentType]}
        size="small"
        variant="outlined"
      />
    ),
  },
];

/** List price, discount, amount paid, VAT, coupon, payment method and date. */
export const priceColumns = (t: TFunction, language: string): DataColumn<Order>[] => [
  {
    key: 'list',
    header: t('revenue.columns.listPrice'),
    render: (row) => formatBdt(row.listPrice),
    hideOnMobile: true,
  },
  { key: 'discount', header: t('revenue.columns.discount'), render: discountText },
  {
    key: 'paid',
    header: t('revenue.columns.amountPaid'),
    render: (row) => (
      <Box component="span" sx={{ fontWeight: 700, color: MONEY_COLOR, whiteSpace: 'nowrap' }}>
        {formatBdt(row.paidPrice)}
      </Box>
    ),
  },
  {
    key: 'vat',
    header: t('revenue.columns.vat'),
    render: (row) => (
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        {vatText(row)}
      </Box>
    ),
  },
  {
    key: 'coupon',
    header: t('revenue.columns.coupon'),
    render: (row) => (
      <Box component="span" sx={{ fontFamily: MONO_FONT }}>
        {couponLabel(row)}
      </Box>
    ),
    hideOnMobile: true,
  },
  {
    key: 'method',
    header: t('revenue.columns.paymentMethod'),
    render: (row) => paymentMethodLabel(t, row),
    hideOnMobile: true,
  },
  {
    key: 'date',
    header: t('revenue.columns.date'),
    render: (row) => formatDateTime(row.createdAt, language),
  },
];

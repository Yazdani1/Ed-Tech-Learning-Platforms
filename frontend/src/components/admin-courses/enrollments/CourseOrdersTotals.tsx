'use client';

import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatBdt } from '@/utils/price';

import type { Order } from '@/schemas/revenue.schema';
import type { FC } from 'react';

interface CourseOrdersTotalsProps {
  /** The rows the filters show now */
  rows: readonly Order[];
}

const sum = (orders: readonly Order[], pick: (order: Order) => number): number =>
  orders.reduce((total, order) => total + pick(order), 0);

/** "12 enrolments shown · Sales ৳… · VAT ৳…" for what the filters show. */
export const CourseOrdersTotals: FC<CourseOrdersTotalsProps> = ({ rows }) => {
  const { t } = useTranslation();
  const paid = rows.filter((row) => row.enrollmentType === 'paid');
  return (
    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
      {t('adminCourses.enrollments.totals', {
        count: rows.length,
        sales: formatBdt(sum(paid, (row) => row.paidPrice)),
        vat: formatBdt(sum(rows, (row) => row.vatAmount)),
      })}
    </Typography>
  );
};

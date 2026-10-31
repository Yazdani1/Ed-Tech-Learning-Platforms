'use client';

import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

import { formatDateTime } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import { MONEY_COLOR, MONO_SX } from '@/components/enrollments/enrollment-display';
import { StudentCell } from '@/components/enrollments/StudentCell';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { AdminEnrollment } from '@/schemas/admin-courses.schema';
import type { ReactNode } from 'react';

const money = (value: number): ReactNode => (
  <Box component="span" sx={{ fontWeight: 700, color: MONEY_COLOR }}>
    {formatBdt(value)}
  </Box>
);

const mono = (text: string): ReactNode => (
  <Box component="span" sx={MONO_SX}>
    {text}
  </Box>
);

/** Columns of "Revenue": student, email, list price, discount, amount paid, date, enrolment id. */
export const useRevenueColumns = (): DataColumn<AdminEnrollment>[] => {
  const { t } = useTranslation();
  return [
    {
      key: 'student',
      header: t('adminCourses.enrollments.columns.student'),
      render: (row) => <StudentCell student={row.student} />,
    },
    {
      key: 'email',
      header: t('adminCourses.enrollments.columns.email'),
      render: (row) => row.student?.email ?? '—',
    },
    {
      key: 'list',
      header: t('adminCourses.enrollments.columns.listPrice'),
      render: (row) => money(row.listPrice),
    },
    {
      key: 'discount',
      header: t('adminCourses.enrollments.columns.discount'),
      render: (row) =>
        row.discountAmount > 0
          ? `${formatBdt(row.discountAmount)} (${Math.round(row.discountPercent)}%)`
          : '-',
    },
    {
      key: 'paid',
      header: t('adminCourses.enrollments.columns.amountPaid'),
      render: (row) => money(row.paidPrice),
    },
    {
      key: 'date',
      header: t('adminCourses.enrollments.columns.date'),
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'id',
      header: t('adminCourses.enrollments.columns.enrollmentId'),
      render: (row) => mono(row._id),
      hideOnMobile: true,
    },
  ];
};

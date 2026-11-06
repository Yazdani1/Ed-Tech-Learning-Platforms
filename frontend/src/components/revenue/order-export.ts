import { formatDateTime } from '@/utils/dateTime';
import { datedFileName, downloadCsv, toCsv } from '@/utils/export-file';
import { printTable } from '@/utils/print-table';

import { buyerName, couponLabel, paymentMethodLabel } from '@/components/orders/order-format';

import type { Order } from '@/schemas/revenue.schema';
import type { TFunction } from 'i18next';

/** Which student details go into the PDF. */
export type PdfField = 'name' | 'studentNumber' | 'email' | 'phone' | 'course';
export const PDF_FIELDS: readonly PdfField[] = [
  'name',
  'studentNumber',
  'email',
  'phone',
  'course',
];

/** The CSV of the chosen orders with every detail. */
export const exportOrdersCsv = (t: TFunction, orders: readonly Order[], language: string): void => {
  const c = (key: string): string => t(`revenue.columns.${key}`);
  const headers = [
    c('orderId'),
    c('date'),
    c('course'),
    c('batch'),
    c('student'),
    c('studentNumber'),
    c('email'),
    c('phone'),
    c('type'),
    c('listPrice'),
    c('discount'),
    c('discountPercent'),
    c('amountPaid'),
    c('currency'),
    c('coupon'),
    c('paymentMethod'),
  ];
  const rows = orders.map((order) => [
    order._id,
    formatDateTime(order.createdAt, language),
    order.course?.title ?? t('revenue.deletedCourse'),
    order.course?.batchNumber,
    buyerName(t, order),
    order.student?.studentNumber,
    order.student?.email,
    order.student?.phone,
    t(`revenue.types.${order.enrollmentType}`),
    order.listPrice,
    order.discountAmount,
    Math.round(order.discountPercent),
    order.paidPrice,
    order.currency,
    couponLabel(order),
    paymentMethodLabel(t, order),
  ]);
  downloadCsv(toCsv(headers, rows), datedFileName('orders', 'csv'));
};

const pdfValue = (t: TFunction, order: Order, field: PdfField): string => {
  if (field === 'name') return buyerName(t, order);
  if (field === 'studentNumber') return order.student?.studentNumber ?? '-';
  if (field === 'email') return order.student?.email ?? '-';
  if (field === 'phone') return order.student?.phone ?? '-';
  return order.course?.title ?? t('revenue.deletedCourse');
};

/**
 * Prints the students of the chosen orders with only the chosen fields (one row per student and course) in
 * the print tab opened for it; the browser's "Save as PDF" saves the file (Bangla names stay readable).
 */
export const printStudents = (
  t: TFunction,
  win: Window,
  orders: readonly Order[],
  fields: readonly PdfField[],
  title: string,
  language: string,
): void => {
  printTable(win, {
    title,
    subtitle: t('revenue.pdf.subtitle', {
      count: orders.length,
      date: formatDateTime(new Date().toISOString(), language),
    }),
    headers: ['#', ...fields.map((field) => t(`revenue.pdf.fields.${field}`))],
    rows: orders.map((order, index) => [
      String(index + 1),
      ...fields.map((field) => pdfValue(t, order, field)),
    ]),
  });
};

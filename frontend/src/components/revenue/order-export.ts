import { formatDateTime } from '@/utils/dateTime';
import { datedFileName, downloadCsv, toCsv } from '@/utils/export-file';
import { printGrid } from '@/utils/print-grid';
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

export interface OrderCsvOptions {
  /** Student email and phone columns (off by default) */
  includeContact: boolean;
  /** File name prefix, e.g. "sales-2026-11" */
  fileName?: string;
}

const sum = (orders: readonly Order[], pick: (order: Order) => number): number =>
  Math.round(orders.reduce((total, order) => total + pick(order), 0) * 100) / 100;

const csvHeaders = (t: TFunction, includeContact: boolean): string[] =>
  [
    'orderId',
    'date',
    'course',
    'batch',
    'student',
    'studentNumber',
    ...(includeContact ? ['email', 'phone'] : []),
    'type',
    'listPrice',
    'discount',
    'discountPercent',
    'amountPaid',
    'vatPercent',
    'vatAmount',
    'netAmount',
    'currency',
    'coupon',
    'paymentMethod',
  ].map((key) => t(`revenue.columns.${key}`));

const csvRow = (t: TFunction, order: Order, language: string, includeContact: boolean) => [
  order._id,
  formatDateTime(order.createdAt, language),
  order.course?.title ?? t('revenue.deletedCourse'),
  order.course?.batchNumber,
  buyerName(t, order),
  order.student?.studentNumber,
  ...(includeContact ? [order.student?.email, order.student?.phone] : []),
  t(`revenue.types.${order.enrollmentType}`),
  order.listPrice,
  order.discountAmount,
  Math.round(order.discountPercent),
  order.paidPrice,
  order.vatPercent,
  order.vatAmount,
  Math.round((order.paidPrice - order.vatAmount) * 100) / 100,
  order.currency,
  couponLabel(order),
  paymentMethodLabel(t, order),
];

/** The totals under the rows: orders, list prices, discounts, sales, VAT and net sales. */
const csvSummary = (t: TFunction, orders: readonly Order[]): (string | number)[][] => {
  const paid = orders.filter((order) => order.enrollmentType === 'paid');
  const sales = sum(paid, (order) => order.paidPrice);
  const vat = sum(orders, (order) => order.vatAmount);
  const s = (key: string): string => t(`revenue.summary.${key}`);
  return [
    [],
    [s('title')],
    [s('orders'), orders.length],
    [s('paidOrders'), paid.length],
    [s('listTotal'), sum(paid, (order) => order.listPrice)],
    [s('discountTotal'), sum(orders, (order) => order.discountAmount)],
    [s('sales'), sales],
    [s('vat'), vat],
    [s('net'), Math.round((sales - vat) * 100) / 100],
  ];
};

/** The CSV of the given orders with every detail (VAT rate and amount included), then the totals. */
export const exportOrdersCsv = (
  t: TFunction,
  orders: readonly Order[],
  language: string,
  { includeContact, fileName = 'orders' }: OrderCsvOptions,
): void => {
  const rows = orders.map((order) => csvRow(t, order, language, includeContact));
  downloadCsv(
    toCsv(csvHeaders(t, includeContact), [...rows, ...csvSummary(t, orders)]),
    datedFileName(fileName, 'csv'),
  );
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

/**
 * Student tokens: one card per order with the chosen fields, 3 per row with dashed cut lines (print, cut,
 * fold and use for a draw).
 */
export const printStudentTokens = (
  t: TFunction,
  win: Window,
  orders: readonly Order[],
  fields: readonly PdfField[],
  title: string,
  language: string,
): void => {
  printGrid(win, {
    title,
    subtitle: t('revenue.pdf.subtitle', {
      count: orders.length,
      date: formatDateTime(new Date().toISOString(), language),
    }),
    cards: orders.map((order) => fields.map((field) => pdfValue(t, order, field))),
  });
};

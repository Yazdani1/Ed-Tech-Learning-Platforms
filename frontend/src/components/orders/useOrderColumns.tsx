'use client';

import { useTranslation } from 'react-i18next';

import { buyerColumns, courseColumn, priceColumns } from './order-columns';

import type { DataColumn } from '@/components/common/ResponsiveDataView';
import type { Order } from '@/schemas/revenue.schema';

interface OrderColumnsOptions {
  /** The Revenue page lists every course: add the course column */
  showCourse: boolean;
}

/**
 * Order columns: (course), student, student ID, type, list price, discount, amount paid, coupon, payment
 * method and date. The row opens the order details.
 */
export const useOrderColumns = ({ showCourse }: OrderColumnsOptions): DataColumn<Order>[] => {
  const { t, i18n } = useTranslation();
  return [
    ...(showCourse ? [courseColumn(t)] : []),
    ...buyerColumns(t),
    ...priceColumns(t, i18n.language),
  ];
};

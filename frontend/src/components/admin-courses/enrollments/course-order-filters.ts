import { DateTime } from 'luxon';

import type { Order, OrderType } from '@/schemas/revenue.schema';

// The course enrolments page loads every enrolment of the course once; these filters run in the browser.

export const COUPON_FILTERS = ['any', 'with', 'without'] as const;
export type CouponFilter = (typeof COUPON_FILTERS)[number];
export const METHOD_FILTERS = ['any', 'bkash', 'other', 'none'] as const;
export type MethodFilter = (typeof METHOD_FILTERS)[number];

export interface CourseOrderFilters {
  search: string;
  type: OrderType;
  coupon: CouponFilter;
  method: MethodFilter;
  /** yyyy-MM-dd, both days included ('' = open) */
  from: string;
  to: string;
}

export const EMPTY_FILTERS: CourseOrderFilters = {
  search: '',
  type: 'all',
  coupon: 'any',
  method: 'any',
  from: '',
  to: '',
};

const DIGITS = /\D/g;

const matchesSearch = (order: Order, search: string): boolean => {
  const text = search.trim().toLowerCase();
  if (!text) return true;
  const student = order.student;
  const digits = text.replace(DIGITS, '');
  const textFields = [student?.name, student?.email, order.couponCode];
  const digitFields = digits ? [student?.studentNumber, student?.phone] : [];
  return (
    textFields.some((value) => value?.toLowerCase().includes(text) === true) ||
    digitFields.some((value) => value?.replace(DIGITS, '').includes(digits) === true)
  );
};

const inDayRange = (order: Order, from: string, to: string): boolean => {
  const day = DateTime.fromISO(order.createdAt).toFormat('yyyy-LL-dd');
  return (!from || day >= from) && (!to || day <= to);
};

const matchesMethod = (order: Order, method: MethodFilter): boolean => {
  if (method === 'any') return true;
  if (method === 'none') return !order.paymentMethod;
  return order.paymentMethod === method;
};

/** The orders that pass every filter (same order as given: newest first). */
export const filterCourseOrders = (
  orders: readonly Order[],
  filters: CourseOrderFilters,
): Order[] =>
  orders.filter(
    (order) =>
      (filters.type === 'all' || order.enrollmentType === filters.type) &&
      (filters.coupon === 'any' || (filters.coupon === 'with') === Boolean(order.couponCode)) &&
      matchesMethod(order, filters.method) &&
      inDayRange(order, filters.from, filters.to) &&
      matchesSearch(order, filters.search),
  );

/** How many filters are set (the "Clear filters" button shows when > 0). */
export const activeFilterCount = (filters: CourseOrderFilters): number =>
  (Object.keys(EMPTY_FILTERS) as (keyof CourseOrderFilters)[]).filter(
    (key) => filters[key] !== EMPTY_FILTERS[key],
  ).length;

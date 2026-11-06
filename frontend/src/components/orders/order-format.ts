import type { Order } from '@/schemas/revenue.schema';
import type { TFunction } from 'i18next';

const NO_VALUE = '—';

/** The buyer's name ("Deleted account" when the user no longer exists). */
export const buyerName = (t: TFunction, order: Order): string => {
  const name = order.student?.name ?? '';
  return name !== '' ? name : t('revenue.deletedStudent');
};

/** "bKash", "Other" or "Not recorded" (orders from before the method was saved, free / subscription). */
export const paymentMethodLabel = (t: TFunction, order: Order): string =>
  order.paymentMethod ? t(`revenue.method.${order.paymentMethod}`) : t('revenue.method.none');

export const couponLabel = (order: Order): string => order.couponCode ?? NO_VALUE;

export const orNone = (value: string | null | undefined): string =>
  value && value.trim() !== '' ? value : NO_VALUE;

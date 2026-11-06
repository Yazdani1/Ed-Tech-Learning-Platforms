import { formatDateTime } from '@/utils/dateTime';
import { formatBdt } from '@/utils/price';

import type { DiscountType } from '@/schemas/coupon.schema';
import type { TFunction } from 'i18next';

/** "20% off" or "৳500 off". */
export const discountLabel = (t: TFunction, type: DiscountType, value: number): string =>
  type === 'percent'
    ? t('coupons.percentOff', { value })
    : t('coupons.amountOff', { amount: formatBdt(value) });

/** "From <start> to <end>", "Until <end>", "From <start>" or "No end date" in the viewer's time zone. */
export const periodLabel = (
  t: TFunction,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  language: string,
): string => {
  const start = startsAt ? formatDateTime(startsAt, language) : '';
  const end = endsAt ? formatDateTime(endsAt, language) : '';
  if (start && end) return t('coupons.period.range', { start, end });
  if (end) return t('coupons.period.until', { end });
  if (start) return t('coupons.period.from', { start });
  return t('coupons.period.open');
};

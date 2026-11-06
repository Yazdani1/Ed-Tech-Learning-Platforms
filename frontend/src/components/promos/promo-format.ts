import { formatBdt } from '@/utils/price';

import type { ActivePromo } from '@/schemas/promo.schema';
import type { TFunction } from 'i18next';

/** The page with every course of the running promo. */
export const PROMO_PAGE = '/promo';

/** "30% OFF" or "৳500 OFF". */
export const promoDiscountLabel = (
  t: TFunction,
  promo: Pick<ActivePromo, 'discountType' | 'value'>,
): string =>
  promo.discountType === 'percent'
    ? t('promos.banner.percentOff', { value: promo.value })
    : t('promos.banner.amountOff', { amount: formatBdt(promo.value) });

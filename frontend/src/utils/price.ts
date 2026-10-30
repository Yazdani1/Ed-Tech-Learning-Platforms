// Course prices, the same rules on every screen (catalog, course page, home, My Courses).

const PERCENT = 100;
/** Amounts use the same separators in both languages (as the old client did), so the locale is fixed. */
const AMOUNT_LOCALE = 'en-US';

/** The price fields of a course as the backend sends them (any course shape that has them). */
export interface PriceableCourse {
  pricing: 'Free' | 'Paid';
  price?: number | null;
  listPrice?: number | null;
  discountPrice?: number | null;
  discountEndsAt?: string | null;
}

export interface PriceInfo {
  isFree: boolean;
  listPrice: number;
  /** What the course costs now (the list price when no discount runs) */
  discountPrice: number;
  discountAmount: number;
  discountPercent: number;
  hasDiscount: boolean;
}

/** "1,200" */
export const formatAmount = (value: number): string => value.toLocaleString(AMOUNT_LOCALE);

/** "৳1,200" (empty for a missing value). */
export const formatBdt = (value: number | null | undefined): string =>
  value === null || value === undefined ? '' : `৳${formatAmount(value)}`;

/** List price, current price and discount of a course (an ended discount counts as none). */
export const getCoursePriceInfo = (
  course: PriceableCourse,
  now: number = Date.now(),
): PriceInfo => {
  if (course.pricing === 'Free') {
    return {
      isFree: true,
      listPrice: 0,
      discountPrice: 0,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
    };
  }
  const listPrice = Math.max(course.listPrice ?? course.price ?? 0, 0);
  const discountActive = !course.discountEndsAt || new Date(course.discountEndsAt).getTime() > now;
  const discountPrice = discountActive
    ? Math.max(course.discountPrice ?? course.price ?? listPrice, 0)
    : listPrice;
  const discountAmount = Math.max(listPrice - discountPrice, 0);
  const discountPercent = listPrice > 0 ? Math.round((discountAmount / listPrice) * PERCENT) : 0;
  return {
    isFree: false,
    listPrice,
    discountPrice,
    discountAmount,
    discountPercent,
    hasDiscount: discountAmount > 0,
  };
};

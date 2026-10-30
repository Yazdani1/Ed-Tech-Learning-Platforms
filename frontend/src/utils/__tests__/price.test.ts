import { describe, expect, it } from 'vitest';

import { formatAmount, formatBdt, getCoursePriceInfo } from '../price';

const NOW = Date.parse('2026-10-30T12:00:00Z');

describe('getCoursePriceInfo', () => {
  it('a free course costs nothing', () => {
    expect(getCoursePriceInfo({ pricing: 'Free', price: 500 })).toEqual({
      isFree: true,
      listPrice: 0,
      discountPrice: 0,
      discountAmount: 0,
      discountPercent: 0,
      hasDiscount: false,
    });
  });

  it('computes the running discount from list and discount price', () => {
    const course = { pricing: 'Paid' as const, listPrice: 1000, discountPrice: 750, price: 750 };
    expect(getCoursePriceInfo(course, NOW)).toMatchObject({
      listPrice: 1000,
      discountPrice: 750,
      discountAmount: 250,
      discountPercent: 25,
      hasDiscount: true,
    });
  });

  it('ignores a discount that has ended', () => {
    const course = {
      pricing: 'Paid' as const,
      listPrice: 1000,
      discountPrice: 750,
      discountEndsAt: '2026-10-01T00:00:00Z',
    };
    expect(getCoursePriceInfo(course, NOW)).toMatchObject({
      discountPrice: 1000,
      hasDiscount: false,
    });
  });

  it('falls back to the plain price when there is no list price', () => {
    expect(getCoursePriceInfo({ pricing: 'Paid', price: 600 }, NOW)).toMatchObject({
      listPrice: 600,
      discountPrice: 600,
      hasDiscount: false,
    });
  });
});

describe('formatBdt / formatAmount', () => {
  it('formats taka with thousands separators (fixed en-US digits)', () => {
    expect(formatBdt(12500)).toBe('৳12,500');
    expect(formatBdt(undefined)).toBe('');
    expect(formatBdt(null)).toBe('');
    expect(formatAmount(1234567)).toBe('1,234,567');
  });
});

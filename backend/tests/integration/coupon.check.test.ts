import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { createCourse, missingId } from '../factories';
import {
  createCouponDoc,
  createDiscountedCourse,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

const INVALID = 'This coupon code is not valid for this course';

const check = (course: string, code?: string) =>
  request(app).get('/api/coupons/check').query({ course, code });

describe('GET /api/coupons/check (public)', () => {
  it('answers what the course own discount code gives (no sign-in needed)', async () => {
    const course = await createDiscountedCourse(800, 'OWN-CHK');
    const res = await check(String(course._id), 'own-chk');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      code: 'OWN-CHK',
      source: 'course',
      price: 800,
      listPrice: 1000,
      discountAmount: 200,
      discountPercent: 20,
    });
  });

  it('answers a percent coupon, an amount coupon and a promo', async () => {
    const course = await createPaidCourse();
    const percent = await createCouponDoc(course, { discountType: 'percent', value: 10 });
    const amount = await createCouponDoc(course, { discountType: 'amount', value: 125 });
    const promo = await createPromoDoc([course], { discountType: 'percent', value: 50 });
    expect((await check(String(course._id), percent.code)).body.data).toMatchObject({
      source: 'coupon',
      price: 900,
    });
    expect((await check(String(course._id), amount.code)).body.data).toMatchObject({
      source: 'coupon',
      price: 875,
      discountPercent: 13,
    });
    expect((await check(String(course._id), promo.code)).body.data).toMatchObject({
      source: 'promo',
      price: 500,
    });
  });

  it('does not expose the coupon id or its usage limit', async () => {
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 3 });
    const res = await check(String(course._id), coupon.code);
    expect(res.body.data).not.toHaveProperty('couponId');
    expect(res.body.data).not.toHaveProperty('usageLimit');
  });

  it('does not use up a limited coupon (a check is only a preview)', async () => {
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 1 });
    await check(String(course._id), coupon.code);
    await check(String(course._id), coupon.code);
    const again = await check(String(course._id), coupon.code);
    expect(again.status).toBe(200);
  });

  it('400 with one message for every reason a code is not valid', async () => {
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    const foreign = await createCouponDoc(other);
    const off = await createCouponDoc(course, { isActive: false });
    const expired = await createCouponDoc(course, { endsAt: hoursFromNow(-3) });
    const scheduled = await createCouponDoc(course, { startsAt: hoursFromNow(3) });
    const full = await createCouponDoc(course, { usageLimit: 1, usedCount: 1 });
    const promoElsewhere = await createPromoDoc([other]);
    const promoOver = await createPromoDoc([course], {
      startsAt: hoursFromNow(-9),
      endsAt: hoursFromNow(-1),
    });
    for (const code of [
      'NO-SUCH',
      foreign.code,
      off.code,
      expired.code,
      scheduled.code,
      full.code,
      promoElsewhere.code,
      promoOver.code,
    ]) {
      const res = await check(String(course._id), code);
      expect(res.status, code).toBe(400);
      expect(res.body.message).toBe(INVALID);
    }
  });

  it('400 for the course discount code outside its dates', async () => {
    const early = await createDiscountedCourse(800, 'FUTURE-1', {
      discountStartsAt: hoursFromNow(4),
    });
    expect((await check(String(early._id), 'FUTURE-1')).status).toBe(400);
  });

  it('400 for a free course (no coupons there)', async () => {
    const course = await createCourse();
    const res = await check(String(course._id), 'ANYCODE');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(INVALID);
  });

  it('400 for a missing or malformed course id, 404 for an unknown course', async () => {
    expect((await check(undefined as unknown as string, 'ABCD')).status).toBe(400);
    expect((await check('nope', 'ABCD')).status).toBe(400);
    expect((await check(missingId(), 'ABCD')).status).toBe(404);
  });

  it('400 for a missing, repeated (list) or too long code', async () => {
    const course = await createPaidCourse();
    expect((await check(String(course._id))).status).toBe(400);
    const repeated = await request(app).get(
      `/api/coupons/check?course=${String(course._id)}&code=A&code=B`,
    );
    expect(repeated.status).toBe(400);
    const nested = await request(app).get(
      `/api/coupons/check?course=${String(course._id)}&code=x&code=y`,
    );
    expect(nested.status).toBe(400);
    expect((await check(String(course._id), 'X'.repeat(41))).status).toBe(400);
  });

  it('404 for a Draft or Private course (a code cannot probe hidden courses)', async () => {
    const draft = await createPaidCourse({ status: 'Draft' });
    const hidden = await createPaidCourse({ visibility: 'Private' });
    for (const course of [draft, hidden]) {
      const coupon = await createCouponDoc(course);
      const res = await check(String(course._id), coupon.code);
      expect(res.status).toBe(404);
    }
  });
});

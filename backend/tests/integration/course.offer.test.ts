import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { authCookie, createCourse, createUser } from '../factories';
import {
  createDiscountedCourse,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

interface Offer {
  code: string;
  source: string;
  price: number;
  listPrice: number;
  discountAmount: number;
  discountPercent: number;
}
interface Row {
  _id: string;
  offer: Offer | null;
}

const findRow = (rows: Row[], id: unknown): Row | undefined =>
  rows.find((row) => String(row._id) === String(id));

/** The `offer` of one course as the three public endpoints answer it. */
const offersOf = async (id: unknown): Promise<(Offer | null | undefined)[]> => {
  const list = await request(app).get('/api/courses');
  const browse = await request(app).get('/api/courses/browse');
  const paged = await request(app).get('/api/courses/browse?page=1&limit=100');
  const one = await request(app).get(`/api/courses/${String(id)}`);
  expect(list.status).toBe(200);
  expect(browse.status).toBe(200);
  expect(paged.status).toBe(200);
  expect(one.status).toBe(200);
  return [
    findRow(list.body.data as Row[], id)?.offer,
    findRow(browse.body.data as Row[], id)?.offer,
    findRow(paged.body.data as Row[], id)?.offer,
    (one.body.data as Row).offer,
  ];
};

describe('offer on the public course endpoints', () => {
  it('is null for a free course and for a paid course without a discount', async () => {
    const free = await createCourse();
    const paid = await createPaidCourse();
    expect(await offersOf(free._id)).toEqual([null, null, null, null]);
    expect(await offersOf(paid._id)).toEqual([null, null, null, null]);
  });

  it('is the course own running discount (auto coupon) with its code and amounts', async () => {
    const course = await createDiscountedCourse(800, 'OWN-DISC');
    for (const offer of await offersOf(course._id)) {
      expect(offer).toMatchObject({
        code: 'OWN-DISC',
        source: 'course',
        price: 800,
        listPrice: 1000,
        discountAmount: 200,
        discountPercent: 20,
      });
    }
  });

  it('is null for a discount that has not started or has ended', async () => {
    const scheduled = await createDiscountedCourse(800, 'SCHED-1', {
      discountStartsAt: hoursFromNow(5),
    });
    const ended = await createDiscountedCourse(800, 'ENDED-1', {
      discountEndsAt: hoursFromNow(-5),
    });
    expect(await offersOf(scheduled._id)).toEqual([null, null, null, null]);
    expect(await offersOf(ended._id)).toEqual([null, null, null, null]);
  });

  it('is null when the discount has no code', async () => {
    const course = await createPaidCourse({ price: 800, discountPrice: 800 });
    expect(await offersOf(course._id)).toEqual([null, null, null, null]);
  });

  it('is a running promo that includes the course', async () => {
    const course = await createPaidCourse();
    const promo = await createPromoDoc([course], { discountType: 'percent', value: 30 });
    for (const offer of await offersOf(course._id)) {
      expect(offer).toMatchObject({
        code: promo.code,
        source: 'promo',
        price: 700,
        discountAmount: 300,
        discountPercent: 30,
      });
    }
  });

  it('applies an amount promo', async () => {
    const course = await createPaidCourse();
    await createPromoDoc([course], { discountType: 'amount', value: 250 });
    const [offer] = await offersOf(course._id);
    expect(offer).toMatchObject({ source: 'promo', price: 750, discountAmount: 250 });
  });

  it('ignores promos that are off, expired, scheduled or for other courses', async () => {
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    await createPromoDoc([course], { isActive: false });
    await createPromoDoc([course], { startsAt: hoursFromNow(-10), endsAt: hoursFromNow(-1) });
    await createPromoDoc([course], { startsAt: hoursFromNow(2), endsAt: hoursFromNow(10) });
    await createPromoDoc([other]);
    expect(await offersOf(course._id)).toEqual([null, null, null, null]);
  });

  it('picks the best (lowest price) of the course discount and the promos', async () => {
    const course = await createDiscountedCourse(800, 'BEST-OWN');
    await createPromoDoc([course], { discountType: 'percent', value: 10 });
    const bigPromo = await createPromoDoc([course], { discountType: 'percent', value: 50 });
    for (const offer of await offersOf(course._id)) {
      expect(offer).toMatchObject({ code: bigPromo.code, source: 'promo', price: 500 });
    }

    const small = await createDiscountedCourse(400, 'BEST-OWN2');
    await createPromoDoc([small], { discountType: 'percent', value: 10 });
    const [offer] = await offersOf(small._id);
    expect(offer).toMatchObject({ code: 'BEST-OWN2', source: 'course', price: 400 });
  });

  it('does not expose internal ids or usage limits in the offer', async () => {
    const course = await createPaidCourse();
    await createPromoDoc([course]);
    const res = await request(app).get(`/api/courses/${String(course._id)}`);
    expect(Object.keys(res.body.data.offer).sort()).toEqual(
      [
        'code',
        'discountAmount',
        'discountPercent',
        'endsAt',
        'listPrice',
        'price',
        'source',
        'startsAt',
      ].sort(),
    );
  });

  it('is also sent to a signed-in student, and the staff list keeps working', async () => {
    const course = await createDiscountedCourse(900, 'STUDENT-VIEW');
    const student = await createUser('Student');
    const res = await request(app).get('/api/courses').set('Cookie', authCookie(student));
    expect(findRow(res.body.data as Row[], course._id)?.offer?.code).toBe('STUDENT-VIEW');
    const admin = await createUser('Admin');
    const staff = await request(app).get('/api/courses').set('Cookie', authCookie(admin));
    expect(staff.status).toBe(200);
  });

  it('SECURITY: the public course response still hides the cover public id and teacher accounts', async () => {
    const course = await createDiscountedCourse(900, 'SEC-CHECK', {
      coverImagePublicId: 'secret/cover',
    });
    const res = await request(app).get(`/api/courses/${String(course._id)}`);
    expect(JSON.stringify(res.body)).not.toContain('secret/cover');
  });
});

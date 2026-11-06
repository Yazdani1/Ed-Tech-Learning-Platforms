import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Coupon } from '../../src/models/Coupon.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import { authCookie, createCourse, createUser, enrol } from '../factories';
import {
  createCouponDoc,
  createDiscountedCourse,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

const INVALID = 'This coupon code is not valid for this course';

const enrolWith = (student: IUser, course: ICourse, body: Record<string, unknown> = {}) =>
  request(app)
    .post(`/api/enrollments/${String(course._id)}`)
    .set('Cookie', authCookie(student))
    .send(body);

const savedOrder = (student: IUser, course: ICourse) =>
  Enrollment.findOne({ student: student._id, course: course._id });

describe('POST /api/enrollments/:courseId with a coupon code', () => {
  it('without a code charges the list price and stores no coupon', async () => {
    const student = await createUser('Student');
    const course = await createDiscountedCourse(800, 'NOT-APPLIED');
    const res = await enrolWith(student, course);
    expect(res.status).toBe(201);
    const order = await savedOrder(student, course);
    expect(order).toMatchObject({ listPrice: 1000, paidPrice: 1000, discountAmount: 0 });
    expect(order?.couponCode).toBeUndefined();
    expect(order?.couponSource).toBeUndefined();
  });

  it('applies the course own discount code (case and spaces ignored)', async () => {
    const student = await createUser('Student');
    const course = await createDiscountedCourse(800, 'OWN-DISC');
    const res = await enrolWith(student, course, { couponCode: ' own-disc ' });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      enrollmentType: 'paid',
      listPrice: 1000,
      paidPrice: 800,
      discountAmount: 200,
      discountPercent: 20,
      couponCode: 'OWN-DISC',
      couponSource: 'course',
    });
  });

  it('400 for the course discount code before it starts or after it ended', async () => {
    const student = await createUser('Student');
    const early = await createDiscountedCourse(800, 'EARLY-1', {
      discountStartsAt: hoursFromNow(5),
    });
    const late = await createDiscountedCourse(800, 'LATE-1', { discountEndsAt: hoursFromNow(-5) });
    for (const [course, code] of [
      [early, 'EARLY-1'],
      [late, 'LATE-1'],
    ] as const) {
      const res = await enrolWith(student, course, { couponCode: code });
      expect(res.status, code).toBe(400);
      expect(res.body.message).toBe(INVALID);
      expect(await savedOrder(student, course)).toBeNull();
    }
  });

  it('applies a percent coupon and counts its use', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, {
      code: 'PCT-25',
      discountType: 'percent',
      value: 25,
    });
    const res = await enrolWith(student, course, { couponCode: 'pct-25' });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      paidPrice: 750,
      discountAmount: 250,
      discountPercent: 25,
      couponCode: 'PCT-25',
      couponSource: 'coupon',
    });
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(1);
  });

  it('applies an amount coupon', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    await createCouponDoc(course, { code: 'AMT-150', discountType: 'amount', value: 150 });
    const res = await enrolWith(student, course, { couponCode: 'AMT-150' });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      paidPrice: 850,
      discountAmount: 150,
      discountPercent: 15,
    });
  });

  it('applies a running promo that includes the course (no use count on the coupon table)', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const promo = await createPromoDoc([course], { discountType: 'percent', value: 40 });
    const res = await enrolWith(student, course, { couponCode: promo.code });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      paidPrice: 600,
      couponCode: promo.code,
      couponSource: 'promo',
    });
  });

  it('SECURITY: the price comes from the database, not from the request', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    await createCouponDoc(course, { code: 'REAL-10', value: 10 });
    const res = await enrolWith(student, course, {
      couponCode: 'REAL-10',
      paidPrice: 1,
      listPrice: 1,
      discountAmount: 999,
      couponSource: 'course',
    });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      listPrice: 1000,
      paidPrice: 900,
      discountAmount: 100,
      couponSource: 'coupon',
    });
  });

  it('400 for an unknown code, and no enrolment is created', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const res = await enrolWith(student, course, { couponCode: 'NO-SUCH-CODE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(INVALID);
    expect(await savedOrder(student, course)).toBeNull();
  });

  it('400 for a coupon of another course', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    const coupon = await createCouponDoc(other);
    const res = await enrolWith(student, course, { couponCode: coupon.code });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(INVALID);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
  });

  it('400 for a switched-off, scheduled or expired coupon, and the use count stays 0', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const off = await createCouponDoc(course, { isActive: false });
    const scheduled = await createCouponDoc(course, { startsAt: hoursFromNow(5) });
    const expired = await createCouponDoc(course, { endsAt: hoursFromNow(-5) });
    for (const coupon of [off, scheduled, expired]) {
      const res = await enrolWith(student, course, { couponCode: coupon.code });
      expect(res.status, coupon.code).toBe(400);
      expect(res.body.message).toBe(INVALID);
      expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
    }
  });

  it('400 for a promo that is off, expired, scheduled or does not include the course', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    const promos = [
      await createPromoDoc([course], { isActive: false }),
      await createPromoDoc([course], { startsAt: hoursFromNow(-10), endsAt: hoursFromNow(-1) }),
      await createPromoDoc([course], { startsAt: hoursFromNow(2), endsAt: hoursFromNow(9) }),
      await createPromoDoc([other]),
    ];
    for (const promo of promos) {
      const res = await enrolWith(student, course, { couponCode: promo.code });
      expect(res.status, promo.code).toBe(400);
      expect(res.body.message).toBe(INVALID);
    }
    expect(await savedOrder(student, course)).toBeNull();
  });

  it('400 when a limited coupon has no uses left', async () => {
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 1, usedCount: 1 });
    const student = await createUser('Student');
    const res = await enrolWith(student, course, { couponCode: coupon.code });
    expect(res.status).toBe(400);
    expect(await savedOrder(student, course)).toBeNull();
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(1);
  });

  it('lets a limited coupon be used exactly its limit of times, then refuses', async () => {
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 2 });
    const students = await Promise.all([1, 2, 3].map(() => createUser('Student')));
    const statuses: number[] = [];
    for (const student of students) {
      statuses.push((await enrolWith(student, course, { couponCode: coupon.code })).status);
    }
    expect(statuses).toEqual([201, 201, 400]);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(2);
    expect(await Enrollment.countDocuments({ course: course._id })).toBe(2);
  });

  it('never gives the last use of a coupon to two students at once', async () => {
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 1 });
    const students = await Promise.all([1, 2, 3, 4].map(() => createUser('Student')));
    const results = await Promise.all(
      students.map((student) => enrolWith(student, course, { couponCode: coupon.code })),
    );
    expect(results.filter((res) => res.status === 201)).toHaveLength(1);
    for (const res of results.filter((r) => r.status !== 201)) {
      expect(res.status).toBe(400);
      expect([INVALID, 'This coupon code has no uses left']).toContain(res.body.message);
    }
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(1);
    expect(await Enrollment.countDocuments({ course: course._id, couponCode: coupon.code })).toBe(
      1,
    );
  });

  it('does not use up a coupon when the student is already enrolled', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 5 });
    await enrol(student, course);
    const res = await enrolWith(student, course, { couponCode: coupon.code });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Already enrolled in this course');
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
  });

  it('does not use up a coupon when the payment method is invalid', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { usageLimit: 5 });
    const res = await enrolWith(student, course, {
      couponCode: coupon.code,
      paymentMethod: 'card',
    });
    expect(res.status).toBe(400);
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
    expect(await savedOrder(student, course)).toBeNull();
  });

  it('400 for a code that is not text or longer than 40 characters', async () => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    for (const couponCode of [{ $ne: null }, ['A'], 12345, 'X'.repeat(41)]) {
      const res = await enrolWith(student, course, { couponCode });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid coupon code');
    }
    expect(await savedOrder(student, course)).toBeNull();
  });

  it('treats an empty or null code as no code', async () => {
    const course = await createPaidCourse();
    for (const couponCode of ['', null]) {
      const student = await createUser('Student');
      const res = await enrolWith(student, course, { couponCode });
      expect(res.status).toBe(201);
      expect((await savedOrder(student, course))?.paidPrice).toBe(1000);
    }
  });

  it('ignores a code and a payment method on a free course (the enrolment is free)', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    const res = await enrolWith(student, course, { couponCode: 'ANYTHING', paymentMethod: 'zzz' });
    expect(res.status).toBe(201);
    const order = await savedOrder(student, course);
    expect(order).toMatchObject({ enrollmentType: 'free', paidPrice: 0 });
    expect(order?.couponCode).toBeUndefined();
    expect(order?.paymentMethod).toBeUndefined();
  });

  it('ignores a coupon for a subscription enrolment (nothing is paid)', async () => {
    const student = await createUser('Student', {
      activeSubscription: {
        plan: 'Pro',
        startDate: new Date(),
        endDate: hoursFromNow(240),
      },
    });
    const course = await createPaidCourse({
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Pro'],
    });
    const coupon = await createCouponDoc(course, { usageLimit: 3 });
    const res = await enrolWith(student, course, { couponCode: coupon.code });
    expect(res.status).toBe(201);
    expect(await savedOrder(student, course)).toMatchObject({
      enrollmentType: 'subscription',
      paidPrice: 0,
    });
    expect((await Coupon.findById(coupon._id))?.usedCount).toBe(0);
  });
});

describe('POST /api/enrollments/:courseId with a payment method', () => {
  it.each(['bkash', 'other'])('stores the payment method %s', async (paymentMethod) => {
    const student = await createUser('Student');
    const course = await createPaidCourse();
    const res = await enrolWith(student, course, { paymentMethod });
    expect(res.status).toBe(201);
    expect((await savedOrder(student, course))?.paymentMethod).toBe(paymentMethod);
  });

  it('stores nothing when no method is sent (or an empty one)', async () => {
    const course = await createPaidCourse();
    for (const paymentMethod of [undefined, '', null]) {
      const student = await createUser('Student');
      const res = await enrolWith(student, course, { paymentMethod });
      expect(res.status).toBe(201);
      expect((await savedOrder(student, course))?.paymentMethod).toBeUndefined();
    }
  });

  it.each(['card', 'BKASH', 'nagad', 123, { $ne: 1 }, ['bkash']])(
    '400 for the payment method %j and no enrolment',
    async (paymentMethod) => {
      const student = await createUser('Student');
      const course = await createPaidCourse();
      const res = await enrolWith(student, course, { paymentMethod });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid payment method');
      expect(await savedOrder(student, course)).toBeNull();
    },
  );
});

describe('POST /api/enrollments/:courseId: access', () => {
  it('401 without a token and 403 for staff roles', async () => {
    const course = await createPaidCourse();
    const anonymous = await request(app)
      .post(`/api/enrollments/${String(course._id)}`)
      .send({});
    expect(anonymous.status).toBe(401);
    for (const role of ['Super Admin', 'Admin', 'Moderator', 'Teacher'] as const) {
      const res = await enrolWith(await createUser(role), course, { couponCode: 'X-CODE' });
      expect(res.status, role).toBe(403);
    }
  });
});

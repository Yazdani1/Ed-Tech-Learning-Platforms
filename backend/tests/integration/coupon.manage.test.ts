import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Coupon } from '../../src/models/Coupon.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import {
  createCouponDoc,
  createDiscountedCourse,
  createOrder,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
  uniqueCode,
} from '../factories/commerce';

import type { IUser } from '../../src/models/User.model';

const as = (user: IUser) => ({ Cookie: authCookie(user) });

const post = (user: IUser, body: Record<string, unknown>) =>
  request(app).post('/api/coupons').set(as(user)).send(body);
const patch = (user: IUser, id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/coupons/${id}`).set(as(user)).send(body);
const list = (user: IUser, course: string) =>
  request(app).get(`/api/coupons?course=${course}`).set(as(user));

interface Item {
  _id: string;
  kind: string;
  code: string;
  status: string;
  usedCount: number;
  value: number;
  discountType: string;
}

describe('GET /api/coupons/suggest', () => {
  it.each(ADMIN_ROLES)('gives %s a free random code', async (role) => {
    const user = await createUser(role);
    const res = await request(app).get('/api/coupons/suggest').set(as(user));
    expect(res.status).toBe(200);
    expect(res.body.data.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect(await Coupon.exists({ code: res.body.data.code })).toBeNull();
  });

  it('gives different codes on every call', async () => {
    const admin = await createUser('Admin');
    const codes = new Set<string>();
    for (let i = 0; i < 5; i += 1) {
      const res = await request(app).get('/api/coupons/suggest').set(as(admin));
      codes.add(res.body.data.code as string);
    }
    expect(codes.size).toBe(5);
  });

  it('401 without a token and 403 for other roles', async () => {
    expect((await request(app).get('/api/coupons/suggest')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await request(app)
        .get('/api/coupons/suggest')
        .set(as(await createUser(role)));
      expect(res.status, role).toBe(403);
    }
  });
});

describe('GET /api/coupons?course=', () => {
  it('lists the course discount (auto), coupons and promos with status and usage', async () => {
    const admin = await createUser('Admin');
    const course = await createDiscountedCourse(800, 'AUTO-LIST');
    const other = await createPaidCourse();
    const active = await createCouponDoc(course, { code: 'ACTIVE-1' });
    const off = await createCouponDoc(course, { code: 'OFF-1', isActive: false });
    const scheduled = await createCouponDoc(course, { code: 'SCHED-1', startsAt: hoursFromNow(5) });
    const expired = await createCouponDoc(course, { code: 'EXP-1', endsAt: hoursFromNow(-5) });
    const limited = await createCouponDoc(course, { code: 'LIM-1', usageLimit: 1 });
    await createCouponDoc(other, { code: 'OTHER-1' });
    const promo = await createPromoDoc([course], { code: 'PROMO-L' });
    const students = await Promise.all([1, 2, 3].map(() => createUser('Student')));
    await createOrder(students[0], course, { couponCode: 'LIM-1', couponSource: 'coupon' });
    await createOrder(students[1], course, { couponCode: 'AUTO-LIST', couponSource: 'course' });
    await createOrder(students[2], course, { couponCode: promo.code, couponSource: 'promo' });

    const res = await list(admin, String(course._id));
    expect(res.status).toBe(200);
    const items = res.body.data as Item[];
    expect(res.body.total).toBe(items.length);
    const byCode = new Map(items.map((item) => [item.code, item]));
    expect([...byCode.keys()].sort()).toEqual(
      ['ACTIVE-1', 'AUTO-LIST', 'EXP-1', 'LIM-1', 'OFF-1', 'PROMO-L', 'SCHED-1'].sort(),
    );
    expect(byCode.get('AUTO-LIST')).toMatchObject({
      _id: `course-${String(course._id)}`,
      kind: 'auto',
      discountType: 'amount',
      value: 200,
      usedCount: 1,
      status: 'active',
    });
    expect(byCode.get('ACTIVE-1')).toMatchObject({
      _id: String(active._id),
      kind: 'coupon',
      status: 'active',
      usedCount: 0,
    });
    expect(byCode.get('OFF-1')?.status).toBe('inactive');
    expect(byCode.get('SCHED-1')?.status).toBe('scheduled');
    expect(byCode.get('EXP-1')?.status).toBe('expired');
    expect(byCode.get('LIM-1')).toMatchObject({ status: 'used-up', usedCount: 1 });
    expect(byCode.get('PROMO-L')).toMatchObject({ kind: 'promo', status: 'active', usedCount: 1 });
    expect([off, scheduled, expired, limited].length).toBe(4);
  });

  it('has no auto item when the course has no running discount code', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await list(admin, String(course._id));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('counts usage only inside the same course', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    await createCouponDoc(course, { code: 'SAME-CODE' });
    await createOrder(await createUser('Student'), other, { couponCode: 'SAME-CODE' });
    const res = await list(admin, String(course._id));
    expect((res.body.data as Item[])[0].usedCount).toBe(0);
  });

  it('400 for a missing or malformed course id and 404 for an unknown course', async () => {
    const admin = await createUser('Admin');
    expect((await request(app).get('/api/coupons').set(as(admin))).status).toBe(400);
    expect((await list(admin, 'nope')).status).toBe(400);
    expect((await list(admin, missingId())).status).toBe(404);
    const array = await request(app).get('/api/coupons?course=a&course=b').set(as(admin));
    expect(array.status).toBe(400);
  });

  it('401 without a token and 403 for other roles', async () => {
    const course = await createPaidCourse();
    expect((await request(app).get(`/api/coupons?course=${String(course._id)}`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await list(await createUser(role), String(course._id));
      expect(res.status, role).toBe(403);
    }
  });
});

describe('POST /api/coupons', () => {
  const body = (course: { _id: unknown }, extra: Record<string, unknown> = {}) => ({
    course: String(course._id),
    code: uniqueCode('new'),
    discountType: 'percent',
    value: 15,
    ...extra,
  });

  it.each(ADMIN_ROLES)('lets %s create a coupon (code upper-cased, defaults set)', async (role) => {
    const user = await createUser(role);
    const course = await createPaidCourse();
    const res = await post(user, body(course, { code: ` new-${role.length}-code ` }));
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Coupon created');
    const saved = await Coupon.findById(res.body.data._id);
    expect(saved).toMatchObject({
      code: `NEW-${role.length}-CODE`,
      discountType: 'percent',
      value: 15,
      usageLimit: null,
      usedCount: 0,
      isActive: true,
    });
    expect(String(saved?.course)).toBe(String(course._id));
    expect(String(saved?.createdBy)).toBe(String(user._id));
  });

  it('saves dates, usage limit and accepts text numbers (form values)', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const startsAt = hoursFromNow(1).toISOString();
    const endsAt = hoursFromNow(50).toISOString();
    const res = await post(
      admin,
      body(course, { value: '12.345', usageLimit: '20', startsAt, endsAt, isActive: false }),
    );
    expect(res.status).toBe(201);
    const saved = await Coupon.findById(res.body.data._id);
    expect(saved).toMatchObject({ value: 12.35, usageLimit: 20, isActive: false });
    expect(saved?.startsAt?.toISOString()).toBe(startsAt);
    expect(saved?.endsAt?.toISOString()).toBe(endsAt);
  });

  it('treats an empty usage limit as unlimited', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await post(admin, body(course, { usageLimit: '' }));
    expect(res.status).toBe(201);
    expect(res.body.data.usageLimit).toBeNull();
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await request(app)
      .post('/api/coupons')
      .set('Authorization', bearer(admin))
      .send(body(course));
    expect(res.status).toBe(201);
  });

  it('400 for a missing or malformed course id', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    expect((await post(admin, { ...body(course), course: undefined })).status).toBe(400);
    expect((await post(admin, body(course, { course: 'nope' }))).status).toBe(400);
    expect((await post(admin, body(course, { course: { $ne: null } }))).status).toBe(400);
  });

  it('404 for an unknown course and 400 for a free course', async () => {
    const admin = await createUser('Admin');
    expect((await post(admin, body({ _id: missingId() }))).status).toBe(404);
    const free = await createCourse();
    const res = await post(admin, body(free));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Coupons are only for paid courses');
  });

  it.each(['abc', 'has space', 'x'.repeat(21), 'under_score', 12345, null, { $ne: 1 }])(
    '400 for the code %j',
    async (code) => {
      const admin = await createUser('Admin');
      const course = await createPaidCourse();
      const res = await post(admin, body(course, { code }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Coupon code must be 6-20 letters, digits or dashes');
    },
  );

  it('400 when the code is missing', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    expect((await post(admin, body(course, { code: undefined }))).status).toBe(400);
  });

  it.each([
    ['type', { discountType: 'flat' }, 'Discount type must be percent or amount'],
    ['no type', { discountType: undefined }, 'Discount type must be percent or amount'],
    ['zero', { value: 0 }, 'Discount must be a number above 0'],
    ['negative', { value: -5 }, 'Discount must be a number above 0'],
    ['text', { value: 'abc' }, 'Discount must be a number above 0'],
    ['missing', { value: undefined }, 'Discount must be a number above 0'],
    ['percent 101', { value: 101 }, 'A percent discount must be 100 or less'],
    [
      'amount at list price',
      { discountType: 'amount', value: 1000 },
      'The discount must be less than the list price',
    ],
    [
      'amount above list price',
      { discountType: 'amount', value: 5000 },
      'The discount must be less than the list price',
    ],
    [
      'usage 0',
      { usageLimit: 0 },
      'Usage limit must be a whole number from 1, or empty for unlimited',
    ],
    [
      'usage 1.5',
      { usageLimit: 1.5 },
      'Usage limit must be a whole number from 1, or empty for unlimited',
    ],
    [
      'usage too big',
      { usageLimit: 100001 },
      'Usage limit must be a whole number from 1, or empty for unlimited',
    ],
    ['start date', { startsAt: 'not a date' }, 'Invalid start date'],
    ['end date', { endsAt: 'not a date' }, 'Invalid end date'],
    ['isActive', { isActive: 'yes' }, 'isActive must be true or false'],
  ])('400 for a bad %s', async (_label, extra, message) => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await post(admin, body(course, extra));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(await Coupon.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 when the end is not after the start', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const at = hoursFromNow(3).toISOString();
    const res = await post(admin, body(course, { startsAt: at, endsAt: at }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The end date must be after the start date');
  });

  it('409 when the code is used by a coupon, a course discount or a promo (any course)', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const other = await createDiscountedCourse(800, 'COURSE-CODE');
    const coupon = await createCouponDoc(other, { code: 'COUPON-CODE' });
    const promo = await createPromoDoc([other], { code: 'PROMO-CODE' });
    for (const code of ['course-code', coupon.code, promo.code]) {
      const res = await post(admin, body(course, { code }));
      expect(res.status, code).toBe(409);
      expect(res.body.message).toBe('This coupon code is already in use');
    }
  });

  it('401 without a token and 403 for other roles (nothing created)', async () => {
    const course = await createPaidCourse();
    expect((await request(app).post('/api/coupons').send(body(course))).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await post(await createUser(role), body(course));
      expect(res.status, role).toBe(403);
    }
    expect(await Coupon.countDocuments({ course: course._id })).toBe(0);
  });
});

describe('PATCH /api/coupons/:id', () => {
  it.each(ADMIN_ROLES)('lets %s change a coupon', async (role) => {
    const user = await createUser(role);
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { value: 10 });
    const newCode = uniqueCode('after').toLowerCase();
    const res = await patch(user, String(coupon._id), {
      code: newCode,
      discountType: 'amount',
      value: 300,
      usageLimit: 5,
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Coupon updated');
    expect(await Coupon.findById(coupon._id)).toMatchObject({
      code: newCode.toUpperCase(),
      discountType: 'amount',
      value: 300,
      usageLimit: 5,
    });
  });

  it('switches a coupon off and on', async () => {
    const admin = await createUser('Admin');
    const coupon = await createCouponDoc(await createPaidCourse());
    await patch(admin, String(coupon._id), { isActive: false });
    expect((await Coupon.findById(coupon._id))?.isActive).toBe(false);
    await patch(admin, String(coupon._id), { isActive: true });
    expect((await Coupon.findById(coupon._id))?.isActive).toBe(true);
  });

  it('changes only the value and keeps the type; checks an amount against the list price', async () => {
    const admin = await createUser('Admin');
    const coupon = await createCouponDoc(await createPaidCourse(), {
      discountType: 'amount',
      value: 100,
    });
    const ok = await patch(admin, String(coupon._id), { value: 400 });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ discountType: 'amount', value: 400 });
    const tooBig = await patch(admin, String(coupon._id), { value: 1000 });
    expect(tooBig.status).toBe(400);
    expect((await Coupon.findById(coupon._id))?.value).toBe(400);
  });

  it('keeps its own code when it is sent again and clears the dates with an empty value', async () => {
    const admin = await createUser('Admin');
    const coupon = await createCouponDoc(await createPaidCourse(), {
      code: 'KEEP-CODE',
      startsAt: hoursFromNow(-2),
      endsAt: hoursFromNow(20),
    });
    const res = await patch(admin, String(coupon._id), {
      code: 'keep-code',
      startsAt: '',
      endsAt: null,
    });
    expect(res.status).toBe(200);
    const saved = await Coupon.findById(coupon._id);
    expect(saved?.code).toBe('KEEP-CODE');
    expect(saved?.startsAt ?? null).toBeNull();
    expect(saved?.endsAt ?? null).toBeNull();
  });

  it('400 when a new end date is not after the saved start date', async () => {
    const admin = await createUser('Admin');
    const coupon = await createCouponDoc(await createPaidCourse(), {
      startsAt: hoursFromNow(10),
      endsAt: hoursFromNow(20),
    });
    const res = await patch(admin, String(coupon._id), { endsAt: hoursFromNow(5).toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The end date must be after the start date');
  });

  it('409 when the new code is used elsewhere', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { code: 'MINE-1' });
    const other = await createCouponDoc(course, { code: 'THEIRS-1' });
    const promo = await createPromoDoc([course]);
    for (const code of [other.code, promo.code]) {
      const res = await patch(admin, String(coupon._id), { code });
      expect(res.status, code).toBe(409);
    }
    expect((await Coupon.findById(coupon._id))?.code).toBe('MINE-1');
  });

  it('400 for invalid fields and changes nothing', async () => {
    const admin = await createUser('Admin');
    const coupon = await createCouponDoc(await createPaidCourse(), { code: 'STAY-1', value: 10 });
    for (const bad of [
      { code: '!' },
      { value: -1 },
      { value: 500, discountType: 'percent' },
      { discountType: 'nope' },
      { usageLimit: 0 },
      { startsAt: 'x' },
      { isActive: 'no' },
    ]) {
      const res = await patch(admin, String(coupon._id), bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
    expect(await Coupon.findById(coupon._id)).toMatchObject({ code: 'STAY-1', value: 10 });
  });

  it('400 for a malformed id and 404 for an unknown coupon', async () => {
    const admin = await createUser('Admin');
    expect((await patch(admin, 'nope', { isActive: false })).status).toBe(400);
    expect((await patch(admin, missingId(), { isActive: false })).status).toBe(404);
  });

  it('401 without a token and 403 for other roles', async () => {
    const coupon = await createCouponDoc(await createPaidCourse());
    const anonymous = await request(app)
      .patch(`/api/coupons/${String(coupon._id)}`)
      .send({ isActive: false });
    expect(anonymous.status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await patch(await createUser(role), String(coupon._id), { isActive: false });
      expect(res.status, role).toBe(403);
    }
    expect((await Coupon.findById(coupon._id))?.isActive).toBe(true);
  });
});

describe('DELETE /api/coupons/:id', () => {
  const remove = (user: IUser, id: string) =>
    request(app).delete(`/api/coupons/${id}`).set(as(user));

  it.each(ADMIN_ROLES)('lets %s delete an unused coupon', async (role) => {
    const user = await createUser(role);
    const coupon = await createCouponDoc(await createPaidCourse());
    const res = await remove(user, String(coupon._id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Coupon deleted' });
    expect(await Coupon.findById(coupon._id)).toBeNull();
  });

  it('400 when students used it (switch it off instead) and keeps the coupon', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const coupon = await createCouponDoc(course, { code: 'USED-ONE' });
    await createOrder(await createUser('Student'), course, {
      couponCode: 'USED-ONE',
      couponSource: 'coupon',
    });
    const res = await remove(admin, String(coupon._id));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'This coupon was used by students; switch it off instead of deleting',
    );
    expect(await Coupon.findById(coupon._id)).not.toBeNull();
  });

  it('deletes a coupon whose code was only used on another course', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const other = await createPaidCourse();
    const coupon = await createCouponDoc(course, { code: 'ELSEWHERE' });
    await createOrder(await createUser('Student'), other, { couponCode: 'ELSEWHERE' });
    expect((await remove(admin, String(coupon._id))).status).toBe(200);
  });

  it('400 for a malformed id and 404 for an unknown coupon', async () => {
    const admin = await createUser('Admin');
    expect((await remove(admin, 'nope')).status).toBe(400);
    expect((await remove(admin, missingId())).status).toBe(404);
  });

  it('401 without a token and 403 for other roles', async () => {
    const coupon = await createCouponDoc(await createPaidCourse());
    expect((await request(app).delete(`/api/coupons/${String(coupon._id)}`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await remove(await createUser(role), String(coupon._id))).status, role).toBe(403);
    }
    expect(await Coupon.findById(coupon._id)).not.toBeNull();
  });
});

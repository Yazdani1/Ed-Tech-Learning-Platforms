import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Promo } from '../../src/models/Promo.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import {
  createCouponDoc,
  createDiscountedCourse,
  createOrder,
  createPaidCourse,
  createPromoDoc,
  hoursFromNow,
} from '../factories/commerce';

import type { IUser } from '../../src/models/User.model';

// Promos are global (home banner, list): every test starts without any
beforeEach(async () => {
  await Promo.deleteMany({});
});

const as = (user: IUser) => ({ Cookie: authCookie(user) });
const post = (user: IUser, body: Record<string, unknown>) =>
  request(app).post('/api/promos').set(as(user)).send(body);
const patch = (user: IUser, id: string, body: Record<string, unknown>) =>
  request(app).patch(`/api/promos/${id}`).set(as(user)).send(body);

const body = (courses: { _id: unknown }[], extra: Record<string, unknown> = {}) => ({
  title: '  Eid sale ',
  code: 'eid-sale',
  discountType: 'percent',
  value: 20,
  startsAt: hoursFromNow(1).toISOString(),
  endsAt: hoursFromNow(72).toISOString(),
  courseIds: courses.map((course) => String(course._id)),
  ...extra,
});

describe('POST /api/promos', () => {
  it.each(ADMIN_ROLES)('lets %s create a promo for published paid courses', async (role) => {
    const user = await createUser(role);
    const a = await createPaidCourse();
    const b = await createPaidCourse({ listPrice: 500, price: 500, discountPrice: 500 });
    const res = await post(user, body([a, b], { code: ` eid-${role.length}-sale ` }));
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Promo created');
    const saved = await Promo.findById(res.body.data._id);
    expect(saved).toMatchObject({
      title: 'Eid sale',
      code: `EID-${role.length}-SALE`,
      discountType: 'percent',
      value: 20,
      isActive: true,
    });
    expect(saved?.courses.map(String).sort()).toEqual([String(a._id), String(b._id)].sort());
    expect(String(saved?.createdBy)).toBe(String(user._id));
  });

  it('saves a duplicate course id once and accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await request(app)
      .post('/api/promos')
      .set('Authorization', bearer(admin))
      .send(body([course, course]));
    expect(res.status).toBe(201);
    expect(res.body.data.courses).toHaveLength(1);
  });

  it('accepts an amount below every list price', async () => {
    const admin = await createUser('Admin');
    const cheap = await createPaidCourse({ listPrice: 300, price: 300, discountPrice: 300 });
    const dear = await createPaidCourse();
    const res = await post(admin, body([cheap, dear], { discountType: 'amount', value: '299' }));
    expect(res.status).toBe(201);
    expect(res.body.data.value).toBe(299);
  });

  it('400 when an amount is not below the list price of every selected course', async () => {
    const admin = await createUser('Admin');
    const cheap = await createPaidCourse({ listPrice: 300, price: 300, discountPrice: 300 });
    const dear = await createPaidCourse();
    const res = await post(admin, body([cheap, dear], { discountType: 'amount', value: 300 }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'The discount must be less than the list price of every selected course',
    );
    expect(await Promo.countDocuments()).toBe(0);
  });

  it('uses the list price, not the discounted price, for the amount check', async () => {
    const admin = await createUser('Admin');
    const course = await createDiscountedCourse(400, 'DISC-X');
    const res = await post(admin, body([course], { discountType: 'amount', value: 600 }));
    expect(res.status).toBe(201);
  });

  it.each([
    ['no title', { title: undefined }],
    ['blank title', { title: '   ' }],
    ['long title', { title: 'x'.repeat(121) }],
    ['title not text', { title: 5 }],
  ])('400 for %s', async (_label, extra) => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await post(admin, body([course], extra));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Title is required (at most 120 characters)');
  });

  it.each(['abc', 'has space', 'x'.repeat(21), 12345, undefined])(
    '400 for the code %j',
    async (code) => {
      const admin = await createUser('Admin');
      const course = await createPaidCourse();
      const res = await post(admin, body([course], { code }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Coupon code must be 6-20 letters, digits or dashes');
    },
  );

  it.each([
    ['type', { discountType: 'x' }, 'Discount type must be percent or amount'],
    ['value 0', { value: 0 }, 'Discount must be a number above 0'],
    ['value text', { value: 'ten' }, 'Discount must be a number above 0'],
    ['percent 150', { value: 150 }, 'A percent discount must be 100 or less'],
    ['no start', { startsAt: undefined }, 'A valid start date is required'],
    ['bad start', { startsAt: 'x' }, 'A valid start date is required'],
    ['no end', { endsAt: undefined }, 'A valid end date is required'],
    ['bad end', { endsAt: 12 }, 'A valid end date is required'],
    ['isActive', { isActive: 'true' }, 'isActive must be true or false'],
  ])('400 for a bad %s', async (_label, extra, message) => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await post(admin, body([course], extra));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(await Promo.countDocuments()).toBe(0);
  });

  it('400 when the end is not after the start', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const at = hoursFromNow(4).toISOString();
    const res = await post(admin, body([course], { startsAt: at, endsAt: at }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The end date must be after the start date');
  });

  it.each([
    ['missing', undefined],
    ['empty', []],
    ['not a list', 'abc'],
    ['an object', { $ne: null }],
  ])('400 when courseIds is %s', async (_label, courseIds) => {
    const admin = await createUser('Admin');
    const res = await post(admin, body([], { courseIds }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Select at least one course');
  });

  it('400 for a malformed course id', async () => {
    const admin = await createUser('Admin');
    for (const courseIds of [['nope'], [123], [{ $ne: null }]]) {
      const res = await post(admin, body([], { courseIds }));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid course id');
    }
  });

  it('404 when a course does not exist', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const res = await post(admin, body([course, { _id: missingId() }]));
    expect(res.status).toBe(404);
  });

  it('400 for a Draft, Free or unpublished course', async () => {
    const admin = await createUser('Admin');
    const draft = await createPaidCourse({ status: 'Draft' });
    const free = await createCourse();
    const paid = await createPaidCourse();
    for (const bad of [draft, free]) {
      const res = await post(admin, body([paid, bad]));
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('A promo can only include published paid courses');
    }
    expect(await Promo.countDocuments()).toBe(0);
  });

  it('409 when the code is used by another promo, a coupon or a course discount', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const other = await createDiscountedCourse(900, 'COURSE-DISC');
    const promo = await createPromoDoc([other]);
    const coupon = await createCouponDoc(other);
    for (const code of [promo.code, coupon.code, 'course-disc']) {
      const res = await post(admin, body([course], { code }));
      expect(res.status, code).toBe(409);
      expect(res.body.message).toBe('This coupon code is already in use');
    }
  });

  it('401 without a token and 403 for other roles (nothing created)', async () => {
    const course = await createPaidCourse();
    expect(
      (
        await request(app)
          .post('/api/promos')
          .send(body([course]))
      ).status,
    ).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await post(await createUser(role), body([course]));
      expect(res.status, role).toBe(403);
    }
    expect(await Promo.countDocuments()).toBe(0);
  });
});

describe('PATCH /api/promos/:id', () => {
  it.each(ADMIN_ROLES)('lets %s change a promo', async (role) => {
    const user = await createUser(role);
    const a = await createPaidCourse();
    const b = await createPaidCourse();
    const promo = await createPromoDoc([a]);
    const endsAt = hoursFromNow(200).toISOString();
    const res = await patch(user, String(promo._id), {
      title: ' New title ',
      value: 35,
      endsAt,
      courseIds: [String(b._id)],
      code: 'new-promo-code',
    });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Promo updated');
    const saved = await Promo.findById(promo._id);
    expect(saved).toMatchObject({ title: 'New title', value: 35, code: 'NEW-PROMO-CODE' });
    expect(saved?.endsAt.toISOString()).toBe(endsAt);
    expect(saved?.courses.map(String)).toEqual([String(b._id)]);
  });

  it('switches a promo off and on, and accepts its own code again', async () => {
    const admin = await createUser('Admin');
    const promo = await createPromoDoc([await createPaidCourse()], { code: 'SELF-CODE' });
    await patch(admin, String(promo._id), { isActive: false });
    expect((await Promo.findById(promo._id))?.isActive).toBe(false);
    const again = await patch(admin, String(promo._id), { isActive: true, code: 'self-code' });
    expect(again.status).toBe(200);
    expect((await Promo.findById(promo._id))?.isActive).toBe(true);
  });

  it('checks an amount against the courses when the type, value or courses change', async () => {
    const admin = await createUser('Admin');
    const dear = await createPaidCourse();
    const cheap = await createPaidCourse({ listPrice: 200, price: 200, discountPrice: 200 });
    const promo = await createPromoDoc([dear], { discountType: 'amount', value: 500 });
    const valueTooBig = await patch(admin, String(promo._id), { value: 1000 });
    expect(valueTooBig.status).toBe(400);
    const coursesTooCheap = await patch(admin, String(promo._id), {
      courseIds: [String(dear._id), String(cheap._id)],
    });
    expect(coursesTooCheap.status).toBe(400);
    const typeChange = await createPromoDoc([cheap], { discountType: 'percent', value: 90 });
    const toAmount = await patch(admin, String(typeChange._id), {
      discountType: 'amount',
      value: 250,
    });
    expect(toAmount.status).toBe(400);
    expect((await Promo.findById(promo._id))?.value).toBe(500);
  });

  it('400 when the new dates make the end not after the start', async () => {
    const admin = await createUser('Admin');
    const promo = await createPromoDoc([await createPaidCourse()]);
    const res = await patch(admin, String(promo._id), { endsAt: hoursFromNow(-5).toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('The end date must be after the start date');
  });

  it('400 for invalid fields and for a Draft course; changes nothing', async () => {
    const admin = await createUser('Admin');
    const draft = await createPaidCourse({ status: 'Draft' });
    const promo = await createPromoDoc([await createPaidCourse()], { title: 'Stay' });
    for (const bad of [
      { title: ' ' },
      { code: '!' },
      { value: 0 },
      { discountType: 'x' },
      { startsAt: 'x' },
      { courseIds: [] },
      { courseIds: [String(draft._id)] },
      { isActive: 1 },
    ]) {
      const res = await patch(admin, String(promo._id), bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
    expect((await Promo.findById(promo._id))?.title).toBe('Stay');
  });

  it('404 when a new course does not exist', async () => {
    const admin = await createUser('Admin');
    const promo = await createPromoDoc([await createPaidCourse()]);
    const res = await patch(admin, String(promo._id), { courseIds: [missingId()] });
    expect(res.status).toBe(404);
  });

  it('409 when the new code is used elsewhere', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const promo = await createPromoDoc([course]);
    const other = await createPromoDoc([course]);
    const coupon = await createCouponDoc(course);
    for (const code of [other.code, coupon.code]) {
      expect((await patch(admin, String(promo._id), { code })).status, code).toBe(409);
    }
  });

  it('400 for a malformed id and 404 for an unknown promo', async () => {
    const admin = await createUser('Admin');
    expect((await patch(admin, 'nope', { isActive: false })).status).toBe(400);
    expect((await patch(admin, missingId(), { isActive: false })).status).toBe(404);
  });

  it('401 without a token and 403 for other roles', async () => {
    const promo = await createPromoDoc([await createPaidCourse()]);
    const anonymous = await request(app)
      .patch(`/api/promos/${String(promo._id)}`)
      .send({ isActive: false });
    expect(anonymous.status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await patch(await createUser(role), String(promo._id), { isActive: false });
      expect(res.status, role).toBe(403);
    }
    expect((await Promo.findById(promo._id))?.isActive).toBe(true);
  });
});

describe('DELETE /api/promos/:id', () => {
  const remove = (user: IUser, id: string) =>
    request(app).delete(`/api/promos/${id}`).set(as(user));

  it.each(ADMIN_ROLES)('lets %s delete an unused promo', async (role) => {
    const user = await createUser(role);
    const promo = await createPromoDoc([await createPaidCourse()]);
    const res = await remove(user, String(promo._id));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Promo deleted' });
    expect(await Promo.findById(promo._id)).toBeNull();
  });

  it('400 when students used it, and keeps the promo', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const promo = await createPromoDoc([course]);
    await createOrder(await createUser('Student'), course, {
      couponCode: promo.code,
      couponSource: 'promo',
    });
    const res = await remove(admin, String(promo._id));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'This promo was used by students; switch it off instead of deleting',
    );
    expect(await Promo.findById(promo._id)).not.toBeNull();
  });

  it('400 for a malformed id and 404 for an unknown promo', async () => {
    const admin = await createUser('Admin');
    expect((await remove(admin, 'nope')).status).toBe(400);
    expect((await remove(admin, missingId())).status).toBe(404);
  });

  it('401 without a token and 403 for other roles', async () => {
    const promo = await createPromoDoc([await createPaidCourse()]);
    expect((await request(app).delete(`/api/promos/${String(promo._id)}`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await remove(await createUser(role), String(promo._id))).status, role).toBe(403);
    }
    expect(await Promo.findById(promo._id)).not.toBeNull();
  });
});

describe('GET /api/promos', () => {
  interface Row {
    _id: string;
    title: string;
    status: string;
    usedCount: number;
    courses: { title: string }[];
    createdBy: { name: string };
  }
  const listAs = (user: IUser, query = '') => request(app).get(`/api/promos${query}`).set(as(user));

  it('lists promos newest first with status, usage, courses and creator name', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    const first = await createPromoDoc([course], { title: 'First' }, admin);
    const off = await createPromoDoc([course], { title: 'Off', isActive: false }, admin);
    const done = await createPromoDoc(
      [course],
      { title: 'Done', startsAt: hoursFromNow(-9), endsAt: hoursFromNow(-1) },
      admin,
    );
    const soon = await createPromoDoc(
      [course],
      { title: 'Soon', startsAt: hoursFromNow(3), endsAt: hoursFromNow(9) },
      admin,
    );
    await createOrder(await createUser('Student'), course, {
      couponCode: first.code,
      couponSource: 'promo',
    });
    await createOrder(await createUser('Student'), course, {
      couponCode: first.code,
      couponSource: 'promo',
    });
    // The same text used by a course coupon does not count as promo use
    await createOrder(await createUser('Student'), course, {
      couponCode: off.code,
      couponSource: 'coupon',
    });

    const res = await listAs(admin);
    expect(res.status).toBe(200);
    const rows = res.body.data as Row[];
    expect(res.body).toMatchObject({ total: 4, page: 1, limit: 10 });
    expect(rows.map((row) => row.title)).toEqual(['Soon', 'Done', 'Off', 'First']);
    const byTitle = new Map(rows.map((row) => [row.title, row]));
    expect(byTitle.get('First')).toMatchObject({ status: 'active', usedCount: 2 });
    expect(byTitle.get('Off')).toMatchObject({ status: 'inactive', usedCount: 0 });
    expect(byTitle.get('Done')?.status).toBe('expired');
    expect(byTitle.get('Soon')?.status).toBe('scheduled');
    expect(byTitle.get('First')?.courses[0].title).toBe(course.title);
    expect(byTitle.get('First')?.createdBy).toEqual({ _id: String(admin._id), name: admin.name });
    expect([done._id, soon._id].length).toBe(2);
  });

  it('paginates and caps the page size at 100', async () => {
    const admin = await createUser('Admin');
    const course = await createPaidCourse();
    for (let i = 0; i < 3; i += 1) await createPromoDoc([course], { title: `P${i}` });
    const page1 = await listAs(admin, '?page=1&limit=2');
    expect(page1.body.data).toHaveLength(2);
    expect(page1.body).toMatchObject({ total: 3, page: 1, limit: 2 });
    const page2 = await listAs(admin, '?page=2&limit=2');
    expect(page2.body.data).toHaveLength(1);
    const capped = await listAs(admin, '?limit=5000');
    expect(capped.body.limit).toBe(100);
    const bad = await listAs(admin, '?page=-3&limit=abc');
    expect(bad.status).toBe(200);
    expect(bad.body).toMatchObject({ page: 1, limit: 10 });
  });

  it('401 without a token and 403 for other roles', async () => {
    expect((await request(app).get('/api/promos')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await listAs(await createUser(role))).status, role).toBe(403);
    }
  });
});

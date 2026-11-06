import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { authCookie, bearer, createUser, missingId, nextId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import { createOrder, createPaidCourse } from '../factories/commerce';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

const NOW = new Date('2030-06-15T12:00:00Z');
const DHAKA = 'Asia/Dhaka';

interface Totals {
  revenue: number;
  orders: number;
  paidOrders: number;
}
interface Point extends Totals {
  date: string;
}
interface OrderRow {
  _id: string;
  enrollmentType: string;
  paidPrice: number;
  student: Record<string, unknown>;
  course: Record<string, unknown>;
}

const as = (user: IUser) => ({ Cookie: authCookie(user) });

const summary = (user: IUser, query = '') =>
  request(app).get(`/api/revenue/summary${query}`).set(as(user));
const orders = (user: IUser, query = '') =>
  request(app).get(`/api/revenue/orders${query}`).set(as(user));
const exported = (user: IUser, query = '') =>
  request(app).get(`/api/revenue/orders/export${query}`).set(as(user));

const at = (iso: string): Date => new Date(iso);

let admin: IUser;
let courseA: ICourse;
let courseB: ICourse;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  await Enrollment.deleteMany({});
  admin = await createUser('Admin');
  courseA = await createPaidCourse({ batchNumber: String(2000 + nextId()) });
  courseB = await createPaidCourse({ batchNumber: String(5000 + nextId()) });
});

afterEach(() => {
  vi.useRealTimers();
});

/** Today 800 + free + subscription, 3 days ago 500, 13 days ago 300, a month before 200 (all course A). */
const seed = async (): Promise<void> => {
  const student = async () => createUser('Student');
  await createOrder(await student(), courseA, {
    paidPrice: 800,
    createdAt: at('2030-06-15T01:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    enrollmentType: 'free',
    paidPrice: 0,
    listPrice: 0,
    createdAt: at('2030-06-15T02:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    enrollmentType: 'subscription',
    paidPrice: 0,
    listPrice: 0,
    createdAt: at('2030-06-15T03:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    paidPrice: 500,
    createdAt: at('2030-06-12T10:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    paidPrice: 300,
    createdAt: at('2030-06-02T10:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    paidPrice: 200,
    createdAt: at('2030-05-20T10:00:00Z'),
  });
};

describe('GET /api/revenue/summary', () => {
  it.each(ADMIN_ROLES)('gives %s the totals: today, 7 days, month, all time', async (role) => {
    await seed();
    const res = await summary(await createUser(role));
    expect(res.status).toBe(200);
    const { totals } = res.body.data as { totals: Record<string, Totals> };
    expect(totals.today).toEqual({ revenue: 800, orders: 3, paidOrders: 1 });
    expect(totals.week).toEqual({ revenue: 1300, orders: 4, paidOrders: 2 });
    expect(totals.month).toEqual({ revenue: 1600, orders: 5, paidOrders: 3 });
    expect(totals.lifetime).toEqual({ revenue: 1800, orders: 6, paidOrders: 4 });
  });

  it('charts 30 days, 12 weeks and 12 months with zero-filled gaps', async () => {
    await seed();
    const res = await summary(admin);
    const { daily, weekly, monthly } = res.body.data as Record<string, Point[]>;
    expect(daily).toHaveLength(30);
    expect(daily[0].date).toBe('2030-05-17');
    expect(daily[daily.length - 1]).toMatchObject({ date: '2030-06-15', revenue: 800, orders: 3 });
    expect(daily.find((p) => p.date === '2030-05-20')).toMatchObject({ revenue: 200, orders: 1 });
    expect(daily.find((p) => p.date === '2030-06-01')).toEqual({
      date: '2030-06-01',
      revenue: 0,
      orders: 0,
      paidOrders: 0,
    });
    expect(weekly).toHaveLength(12);
    expect(weekly[weekly.length - 1]).toMatchObject({
      date: '2030-06-10',
      revenue: 1300,
      orders: 4,
    });
    expect(monthly).toHaveLength(12);
    expect(monthly[0].date).toBe('2029-07');
    expect(monthly.find((p) => p.date === '2030-05')?.revenue).toBe(200);
    expect(monthly.find((p) => p.date === '2030-06')).toMatchObject({ revenue: 1600, orders: 5 });
  });

  it('filters by type and by courses', async () => {
    await seed();
    await createOrder(await createUser('Student'), courseB, {
      paidPrice: 50,
      createdAt: at('2030-06-15T04:00:00Z'),
    });
    const lifetime = async (query: string) =>
      (await summary(admin, query)).body.data.totals.lifetime as Totals;
    expect(await lifetime('')).toMatchObject({ revenue: 1850, orders: 7 });
    expect(await lifetime('?type=paid')).toEqual({ revenue: 1850, orders: 5, paidOrders: 5 });
    expect(await lifetime('?type=free')).toEqual({ revenue: 0, orders: 1, paidOrders: 0 });
    expect(await lifetime('?type=subscription')).toEqual({ revenue: 0, orders: 1, paidOrders: 0 });
    expect(await lifetime(`?courseIds=${String(courseB._id)}`)).toEqual({
      revenue: 50,
      orders: 1,
      paidOrders: 1,
    });
    expect(
      await lifetime(`?courseIds=${String(courseA._id)},${String(courseB._id)}&type=paid`),
    ).toMatchObject({
      revenue: 1850,
    });
  });

  it("puts an order on the viewer's day: the same moment is yesterday in UTC and today in Dhaka", async () => {
    await createOrder(await createUser('Student'), courseA, {
      paidPrice: 100,
      createdAt: at('2030-06-14T19:00:00Z'),
    });
    const utc = await summary(admin);
    expect(utc.body.data.totals.today.revenue).toBe(0);
    const dhaka = await summary(admin, `?tz=${DHAKA}`);
    expect(dhaka.body.data.totals.today).toEqual({ revenue: 100, orders: 1, paidOrders: 1 });
    expect(dhaka.body.data.daily.at(-1)).toMatchObject({ date: '2030-06-15', revenue: 100 });
  });

  it('counts a paid order with a 100 percent coupon as 0 revenue', async () => {
    const course = await createPaidCourse({ price: 1000 });
    await createOrder(await createUser('Student'), course, {
      listPrice: 1000,
      paidPrice: 0,
      discountAmount: 1000,
      discountPercent: 100,
      couponCode: 'FREE-100',
      couponSource: 'coupon',
      createdAt: at('2030-06-15T05:00:00Z'),
    });
    const res = await summary(admin, `?courseIds=${String(course._id)}`);
    expect(res.body.data.totals.lifetime).toEqual({ revenue: 0, orders: 1, paidOrders: 1 });
  });

  it('answers zeros when there are no orders', async () => {
    const res = await summary(admin);
    expect(res.status).toBe(200);
    expect(res.body.data.totals.lifetime).toEqual({ revenue: 0, orders: 0, paidOrders: 0 });
  });

  it('400 for a bad time zone, type or course ids', async () => {
    expect((await summary(admin, '?tz=Mars/Base')).status).toBe(400);
    expect((await summary(admin, '?type=refunded')).status).toBe(400);
    expect((await summary(admin, '?courseIds=nope')).status).toBe(400);
    expect((await summary(admin, `?courseIds=${String(courseA._id)},nope`)).status).toBe(400);
    expect((await summary(admin, '?courseIds=a&courseIds=b')).status).toBe(400);
  });

  it('accepts the Bearer header, 401 without a token and 403 for other roles', async () => {
    const bearerRes = await request(app)
      .get('/api/revenue/summary')
      .set('Authorization', bearer(admin));
    expect(bearerRes.status).toBe(200);
    expect((await request(app).get('/api/revenue/summary')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await summary(await createUser(role))).status, role).toBe(403);
    }
  });
});

describe('GET /api/revenue/orders', () => {
  it.each(ADMIN_ROLES)('lets %s page through the orders, newest first', async (role) => {
    await seed();
    const res = await orders(await createUser(role), '?limit=4');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, total: 6, page: 1, limit: 4 });
    const rows = res.body.data as OrderRow[];
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.paidPrice)).toEqual([0, 0, 800, 500]);
    const second = await orders(admin, '?limit=4&page=2');
    expect((second.body.data as OrderRow[]).map((row) => row.paidPrice)).toEqual([300, 200]);
  });

  it('shows student and course details, never the password or other private fields', async () => {
    const student = await createUser('Student', { phone: '01700000000' });
    await createOrder(student, courseA, {
      paidPrice: 900,
      couponCode: 'SHOW-1',
      couponSource: 'coupon',
      paymentMethod: 'bkash',
    });
    const res = await orders(admin);
    const row = (res.body.data as OrderRow[])[0];
    expect(row).toMatchObject({
      paidPrice: 900,
      couponCode: 'SHOW-1',
      couponSource: 'coupon',
      paymentMethod: 'bkash',
    });
    expect(row.student).toMatchObject({
      name: student.name,
      email: student.email,
      phone: '01700000000',
    });
    expect(row.student).toHaveProperty('studentNumber');
    expect(row.course).toMatchObject({ title: courseA.title, batchNumber: courseA.batchNumber });
    expect(JSON.stringify(res.body)).not.toContain('password');
    expect(row.student).not.toHaveProperty('role');
    expect(row.student).not.toHaveProperty('activeSubscription');
  });

  it('filters by type and courses', async () => {
    await seed();
    await createOrder(await createUser('Student'), courseB, { paidPrice: 50 });
    expect((await orders(admin, '?type=free')).body.total).toBe(1);
    expect((await orders(admin, '?type=paid')).body.total).toBe(5);
    expect((await orders(admin, `?courseIds=${String(courseB._id)}`)).body.total).toBe(1);
    expect(
      (await orders(admin, `?courseIds=${String(courseA._id)}&type=subscription`)).body.total,
    ).toBe(1);
    expect((await orders(admin, `?courseIds=${missingId()}`)).body.total).toBe(0);
    expect((await orders(admin, '?courseIds=')).body.total).toBe(7);
  });

  it('keeps the page size between 1 and 100 and the page at 1 or more', async () => {
    await seed();
    const big = await orders(admin, '?limit=100000');
    expect(big.body.limit).toBe(100);
    const bad = await orders(admin, '?page=0&limit=0');
    expect(bad.body).toMatchObject({ page: 1, limit: 10 });
    const negative = await orders(admin, '?page=-4&limit=-1');
    expect(negative.body.page).toBe(1);
    expect(negative.body.limit).toBe(1);
  });

  it('400 for a bad type or course ids (also a list or too many ids)', async () => {
    expect((await orders(admin, '?type=other')).status).toBe(400);
    expect((await orders(admin, '?courseIds=abc')).status).toBe(400);
    expect((await orders(admin, '?courseIds=a&courseIds=b')).status).toBe(400);
    const many = Array.from({ length: 201 }, () => missingId()).join(',');
    expect((await orders(admin, `?courseIds=${many}`)).status).toBe(400);
  });

  it('401 without a token and 403 for other roles', async () => {
    expect((await request(app).get('/api/revenue/orders')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await orders(await createUser(role))).status, role).toBe(403);
    }
  });
});

describe('GET /api/revenue/orders/export', () => {
  it.each(ADMIN_ROLES)('gives %s every matching order in one list', async (role) => {
    await seed();
    const res = await exported(await createUser(role));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(6);
    expect(res.body.data).toHaveLength(6);
    expect(res.body).not.toHaveProperty('page');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('uses the same filters as the list', async () => {
    await seed();
    expect((await exported(admin, '?type=paid')).body.total).toBe(4);
    expect((await exported(admin, `?courseIds=${String(courseB._id)}`)).body.total).toBe(0);
    expect((await exported(admin, '?type=bad')).status).toBe(400);
    expect((await exported(admin, '?courseIds=nope')).status).toBe(400);
  });

  it('is not mistaken for an order id route', async () => {
    const res = await exported(admin);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('401 without a token and 403 for other roles', async () => {
    expect((await request(app).get('/api/revenue/orders/export')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await exported(await createUser(role))).status, role).toBe(403);
    }
  });
});

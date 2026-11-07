import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { authCookie, createUser, nextId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import { createOrder, createPaidCourse } from '../factories/commerce';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';

const NOW = new Date('2030-06-15T12:00:00Z');
const at = (iso: string): Date => new Date(iso);
const get = (user: IUser, path: string) =>
  request(app).get(`/api/revenue/${path}`).set('Cookie', authCookie(user));

let admin: IUser;
let courseA: ICourse;
let courseB: ICourse;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'], now: NOW });
  await Enrollment.deleteMany({});
  admin = await createUser('Admin');
  courseA = await createPaidCourse({ title: 'Course A', batchNumber: String(3000 + nextId()) });
  courseB = await createPaidCourse({ title: 'Course B', batchNumber: String(6000 + nextId()) });
});

afterEach(() => {
  vi.useRealTimers();
});

/** June: A 1150 (VAT 150) + B 575 (VAT 75) + a free one; May: A 1000 (no VAT). */
const seed = async (): Promise<void> => {
  const student = () => createUser('Student');
  await createOrder(await student(), courseA, {
    listPrice: 1150,
    paidPrice: 1150,
    vatPercent: 15,
    vatAmount: 150,
    createdAt: at('2030-06-10T10:00:00Z'),
  });
  await createOrder(await student(), courseB, {
    listPrice: 1150,
    paidPrice: 575,
    discountAmount: 575,
    discountPercent: 50,
    vatPercent: 15,
    vatAmount: 75,
    createdAt: at('2030-06-11T10:00:00Z'),
  });
  await createOrder(await student(), courseA, {
    enrollmentType: 'free',
    listPrice: 0,
    paidPrice: 0,
    createdAt: at('2030-06-12T10:00:00Z'),
  });
  await createOrder(await student(), courseA, { createdAt: at('2030-05-20T10:00:00Z') });
};

describe('GET /api/revenue/months', () => {
  it.each(ADMIN_ROLES)('gives %s one row per month, newest first, with VAT', async (role) => {
    await seed();
    const res = await get(await createUser(role), 'months');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { month: '2030-06', revenue: 1725, vat: 225, orders: 3, paidOrders: 2 },
      { month: '2030-05', revenue: 1000, vat: 0, orders: 1, paidOrders: 1 },
    ]);
  });

  it('always includes this month, even without orders', async () => {
    const res = await get(admin, 'months');
    expect(res.body.data).toEqual([
      { month: '2030-06', revenue: 0, vat: 0, orders: 0, paidOrders: 0 },
    ]);
  });

  it("groups by the viewer's month", async () => {
    await createOrder(await createUser('Student'), courseA, {
      createdAt: at('2030-05-31T20:00:00Z'),
    });
    const utc = await get(admin, 'months');
    expect(utc.body.data[1]).toMatchObject({ month: '2030-05', orders: 1 });
    const dhaka = await get(admin, 'months?tz=Asia/Dhaka');
    expect(dhaka.body.data).toHaveLength(1);
    expect(dhaka.body.data[0]).toMatchObject({ month: '2030-06', orders: 1 });
  });

  it('400 for a bad time zone; 401 and 403', async () => {
    expect((await get(admin, 'months?tz=Mars/Base')).status).toBe(400);
    expect((await request(app).get('/api/revenue/months')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await get(await createUser(role), 'months')).status, role).toBe(403);
    }
  });
});

describe('GET /api/revenue/breakdown', () => {
  it.each(ADMIN_ROLES)('gives %s the totals and the top courses', async (role) => {
    await seed();
    const res = await get(await createUser(role), 'breakdown');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      orders: 4,
      paidOrders: 3,
      freeOrders: 1,
      subscriptionOrders: 0,
      revenue: 2725,
      vat: 225,
      netRevenue: 2500,
      listTotal: 3300,
      discountTotal: 575,
      topCourses: [
        {
          courseId: String(courseA._id),
          title: 'Course A',
          batchNumber: courseA.batchNumber,
          revenue: 2150,
          orders: 2,
        },
        {
          courseId: String(courseB._id),
          title: 'Course B',
          batchNumber: courseB.batchNumber,
          revenue: 575,
          orders: 1,
        },
      ],
    });
  });

  it('filters by date range (from included, to excluded), type and course', async () => {
    await seed();
    const june = '?from=2030-06-01T00:00:00.000Z&to=2030-07-01T00:00:00.000Z';
    expect((await get(admin, `breakdown${june}`)).body.data).toMatchObject({
      orders: 3,
      revenue: 1725,
      vat: 225,
    });
    expect((await get(admin, `breakdown${june}&type=free`)).body.data).toMatchObject({
      orders: 1,
      revenue: 0,
    });
    expect(
      (await get(admin, `breakdown${june}&courseIds=${String(courseB._id)}`)).body.data,
    ).toMatchObject({
      orders: 1,
      vat: 75,
    });
    expect((await get(admin, 'breakdown?to=2030-06-10T10:00:00.000Z')).body.data).toMatchObject({
      orders: 1,
    });
  });

  it('applies the date range to the order list and the export too', async () => {
    await seed();
    const may = '?from=2030-05-01T00:00:00.000Z&to=2030-06-01T00:00:00.000Z';
    expect((await get(admin, `orders${may}`)).body.total).toBe(1);
    expect((await get(admin, `orders/export${may}`)).body.total).toBe(1);
    const row = (
      await get(admin, 'orders?from=2030-06-10T00:00:00.000Z&to=2030-06-11T00:00:00.000Z')
    ).body.data[0];
    expect(row).toMatchObject({ vatPercent: 15, vatAmount: 150 });
  });

  it('answers zeros without orders', async () => {
    const res = await get(admin, 'breakdown');
    expect(res.body.data).toMatchObject({ orders: 0, revenue: 0, vat: 0, topCourses: [] });
  });

  it('400 for bad dates or a from after the to', async () => {
    expect((await get(admin, 'breakdown?from=yesterday')).status).toBe(400);
    expect((await get(admin, 'breakdown?to=2030-13-45')).status).toBe(400);
    expect((await get(admin, 'breakdown?from=a&from=b')).status).toBe(400);
    expect(
      (await get(admin, 'breakdown?from=2030-06-02T00:00:00.000Z&to=2030-06-01T00:00:00.000Z'))
        .status,
    ).toBe(400);
    expect((await get(admin, 'orders?from=nope')).status).toBe(400);
  });

  it('401 and 403', async () => {
    expect((await request(app).get('/api/revenue/breakdown')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await get(await createUser(role), 'breakdown')).status, role).toBe(403);
    }
  });
});

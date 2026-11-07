import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { AuditLog } from '../../src/models/AuditLog.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import { SiteSetting } from '../../src/models/SiteSetting.model';
import { authCookie, bearer, createCourse, createUser, createUsersForAllRoles } from '../factories';
import { createPaidCourse } from '../factories/commerce';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const URL = '/api/site-settings/vat';
let users: Record<UserRole, IUser>;
const as = (role: UserRole) => authCookie(users[role]);
const setVat = (vatPercent: unknown, role: UserRole = 'Super Admin') =>
  request(app).put(URL).set('Cookie', as(role)).send({ vatPercent });

beforeAll(async () => {
  users = await createUsersForAllRoles();
});
beforeEach(async () => {
  await Promise.all([
    SiteSetting.deleteMany({}),
    AuditLog.deleteMany({}),
    Enrollment.deleteMany({}),
  ]);
});

describe('GET /api/site-settings/vat', () => {
  it('starts at 0 with no history', async () => {
    const res = await request(app).get(URL).set('Cookie', as('Super Admin'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { vatPercent: 0, history: [] } });
  });

  it('accepts the Bearer header', async () => {
    const res = await request(app).get(URL).set('Authorization', bearer(users['Super Admin']));
    expect(res.status).toBe(200);
  });

  it('401 for guests and 403 for every other role', async () => {
    expect((await request(app).get(URL)).status).toBe(401);
    for (const role of ['Admin', 'Moderator', 'Teacher', 'Student'] as UserRole[]) {
      expect((await request(app).get(URL).set('Cookie', as(role))).status, role).toBe(403);
    }
  });
});

describe('PUT /api/site-settings/vat', () => {
  it('saves the rate and records who changed it from what to what', async () => {
    const first = await setVat(15);
    expect(first.status).toBe(200);
    expect(first.body.data.vatPercent).toBe(15);
    const second = await setVat(7.5);
    expect(second.body.data.vatPercent).toBe(7.5);
    const { history } = second.body.data as {
      history: Array<{
        before: { vatPercent: number };
        after: { vatPercent: number };
        actor: Record<string, unknown>;
      }>;
    };
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ before: { vatPercent: 15 }, after: { vatPercent: 7.5 } });
    expect(history[1]).toMatchObject({ before: { vatPercent: 0 }, after: { vatPercent: 15 } });
    expect(history[0].actor).toMatchObject({
      name: users['Super Admin'].name,
      role: 'Super Admin',
    });
    expect(JSON.stringify(second.body)).not.toContain('password');
  });

  it.each([[-1], [100.5], ['15'], [null], [Number.NaN], [12.345]])('400 for %p', async (value) => {
    expect((await setVat(value)).status).toBe(400);
    expect(await AuditLog.countDocuments()).toBe(0);
  });

  it('accepts rates with 2 decimals that are not exact in floating point (0.07, 0.29)', async () => {
    expect((await setVat(0.07)).status).toBe(200);
    expect((await setVat(0.29)).status).toBe(200);
  });

  it('400 when the rate does not change', async () => {
    await setVat(10);
    const res = await setVat(10);
    expect(res.status).toBe(400);
    expect(await AuditLog.countDocuments()).toBe(1);
  });

  it('401 for guests and 403 for every other role', async () => {
    expect((await request(app).put(URL).send({ vatPercent: 5 })).status).toBe(401);
    for (const role of ['Admin', 'Moderator', 'Teacher', 'Student'] as UserRole[]) {
      expect((await setVat(5, role)).status, role).toBe(403);
    }
    expect(await SiteSetting.countDocuments()).toBe(0);
  });
});

describe('VAT on enrolments', () => {
  const enrolIn = async (courseId: unknown, student: IUser) =>
    request(app)
      .post(`/api/enrollments/${String(courseId)}`)
      .set('Cookie', authCookie(student))
      .send({ enrollmentType: 'paid' });

  it('records the rate in force and the VAT included in what was paid', async () => {
    await setVat(15);
    const course = await createPaidCourse({ listPrice: 1150, price: 1150, discountPrice: 1150 });
    const student = await createUser('Student');
    expect((await enrolIn(course._id, student)).status).toBe(201);
    const order = await Enrollment.findOne({ student: student._id }).lean();
    expect(order).toMatchObject({ paidPrice: 1150, vatPercent: 15, vatAmount: 150 });
  });

  it('keeps old orders at their rate when the rate changes', async () => {
    const course = await createPaidCourse();
    const early = await createUser('Student');
    await enrolIn(course._id, early);
    await setVat(10);
    const late = await createUser('Student');
    await enrolIn(course._id, late);
    expect(await Enrollment.findOne({ student: early._id }).lean()).toMatchObject({
      vatPercent: 0,
      vatAmount: 0,
    });
    expect(await Enrollment.findOne({ student: late._id }).lean()).toMatchObject({
      vatPercent: 10,
      vatAmount: 90.91,
    });
  });

  it('adds no VAT to free enrolments', async () => {
    await setVat(15);
    const course = await createCourse();
    const student = await createUser('Student');
    expect((await enrolIn(course._id, student)).status).toBe(201);
    expect(await Enrollment.findOne({ student: student._id }).lean()).toMatchObject({
      vatPercent: 0,
      vatAmount: 0,
    });
  });
});

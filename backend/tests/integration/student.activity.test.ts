import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { User } from '../../src/models/User.model';
import { authCookie, bearer, createCourse, createUser } from '../factories';
import { createOrder, createPaidCourse } from '../factories/commerce';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const ping = (user: IUser, seconds: unknown) =>
  request(app).post('/api/auth/me/activity').set('Cookie', authCookie(user)).send({ seconds });

describe('POST /api/auth/me/activity', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds the time, never more than the time passed since the last report', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2030-01-01T10:00:00Z') });
    const student = await createUser('Student');
    const first = await ping(student, 60);
    expect(first.status).toBe(200);
    expect(first.body.data).toEqual({ timeSpentSeconds: 60, credited: 60 });
    // A second tab reporting at the same moment adds nothing
    expect((await ping(student, 60)).body.data).toEqual({ timeSpentSeconds: 60, credited: 0 });
    vi.setSystemTime(new Date('2030-01-01T10:00:30Z'));
    expect((await ping(student, 60)).body.data).toEqual({ timeSpentSeconds: 90, credited: 30 });
    vi.setSystemTime(new Date('2030-01-01T10:05:00Z'));
    expect((await ping(student, 60)).body.data).toEqual({ timeSpentSeconds: 150, credited: 60 });
    const me = await request(app).get('/api/auth/me').set('Cookie', authCookie(student));
    expect(me.body.data.timeSpentSeconds).toBe(150);
  });

  it.each([[0], [121], [1.5], ['60'], [null]])('400 for %p', async (value) => {
    expect((await ping(await createUser('Student'), value)).status).toBe(400);
  });

  it('401 without a token, Bearer accepted, 403 for staff', async () => {
    expect((await request(app).post('/api/auth/me/activity').send({ seconds: 60 })).status).toBe(
      401,
    );
    const student = await createUser('Student');
    const res = await request(app)
      .post('/api/auth/me/activity')
      .set('Authorization', bearer(student))
      .send({ seconds: 60 });
    expect(res.status).toBe(200);
    for (const role of ['Super Admin', 'Admin', 'Moderator', 'Teacher'] as UserRole[]) {
      expect((await ping(await createUser(role), 60)).status, role).toBe(403);
    }
  });
});

describe('GET /api/enrollments/me/purchases', () => {
  it('lists only my orders with the totals and never the VAT', async () => {
    const me = await createUser('Student');
    const paid = await createPaidCourse({ title: 'Paid one' });
    const free = await createCourse({ title: 'Free one' });
    await createOrder(me, paid, {
      listPrice: 1000,
      paidPrice: 800,
      discountAmount: 200,
      discountPercent: 20,
      couponCode: 'SAVE-20',
      couponSource: 'coupon',
      paymentMethod: 'bkash',
      vatPercent: 15,
      vatAmount: 104.35,
    });
    await createOrder(me, free, { enrollmentType: 'free', listPrice: 0, paidPrice: 0 });
    await createOrder(await createUser('Student'), paid);

    const res = await request(app)
      .get('/api/enrollments/me/purchases')
      .set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.totals).toEqual({
      courses: 2,
      paidCourses: 1,
      totalSpent: 800,
      totalSaved: 200,
    });
    const order = res.body.data.purchases.find(
      (row: { enrollmentType: string }) => row.enrollmentType === 'paid',
    );
    expect(order).toMatchObject({
      listPrice: 1000,
      amountPaid: 800,
      couponCode: 'SAVE-20',
      paymentMethod: 'bkash',
      course: { title: 'Paid one' },
    });
    expect(JSON.stringify(res.body)).not.toContain('vat');
  });

  it('401 without a token and 403 for staff', async () => {
    expect((await request(app).get('/api/enrollments/me/purchases')).status).toBe(401);
    const admin = await createUser('Admin');
    expect(
      (await request(app).get('/api/enrollments/me/purchases').set('Cookie', authCookie(admin)))
        .status,
    ).toBe(403);
  });
});

describe('Students page filters and export', () => {
  let superAdmin: IUser;
  let paidStudent: IUser;
  let freeStudent: IUser;
  let idle: IUser;

  beforeEach(async () => {
    await Promise.all([User.deleteMany({ role: 'Student' }), Enrollment.deleteMany({})]);
    superAdmin = await createUser('Super Admin');
    paidStudent = await createUser('Student', { phone: '01711111111' });
    freeStudent = await createUser('Student');
    idle = await createUser('Student');
    await User.updateOne({ _id: idle._id }, { isBlocked: true, timeSpentSeconds: 7200 });
    await createOrder(paidStudent, await createPaidCourse());
    await createOrder(freeStudent, await createCourse(), {
      enrollmentType: 'free',
      listPrice: 0,
      paidPrice: 0,
    });
  });

  const ids = (res: request.Response) =>
    (res.body.data as Array<{ _id: string }>).map((row) => row._id).sort();
  const list = (query: string, user: IUser = superAdmin) =>
    request(app).get(`/api/students${query}`).set('Cookie', authCookie(user));

  it('filters by enrolment type, none, status, phone and join date; sorts by time spent', async () => {
    expect(ids(await list('?enrollment=paid'))).toEqual([String(paidStudent._id)]);
    expect(ids(await list('?enrollment=free'))).toEqual([String(freeStudent._id)]);
    expect(ids(await list('?enrollment=none'))).toEqual([String(idle._id)]);
    expect(ids(await list('?status=blocked'))).toEqual([String(idle._id)]);
    expect((await list('?status=active')).body.total).toBe(2);
    expect(ids(await list('?hasPhone=true'))).toEqual([String(paidStudent._id)]);
    expect((await list('?hasPhone=false')).body.total).toBe(2);
    expect(
      (await list('?joinedFrom=2000-01-01T00:00:00.000Z&joinedTo=2001-01-01T00:00:00.000Z')).body
        .total,
    ).toBe(0);
    const sorted = await list('?sort=timeSpent');
    expect(sorted.body.data[0]).toMatchObject({
      _id: String(idle._id),
      timeSpentSeconds: 7200,
      isBlocked: true,
    });
  });

  it('400 for bad filters', async () => {
    expect((await list('?enrollment=gold')).status).toBe(400);
    expect((await list('?status=gone')).status).toBe(400);
    expect((await list('?joinedFrom=nope')).status).toBe(400);
    expect(
      (await list('?joinedFrom=2030-01-02T00:00:00Z&joinedTo=2030-01-01T00:00:00Z')).status,
    ).toBe(400);
  });

  it('exports every matching student with spending for a Super Admin only', async () => {
    const res = await request(app)
      .get('/api/students/export?enrollment=paid')
      .set('Cookie', authCookie(superAdmin));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({
      email: paidStudent.email,
      phone: '01711111111',
      enrolledCourses: 1,
    });
    expect(JSON.stringify(res.body)).not.toContain('password');
    const admin = await createUser('Admin');
    expect(
      (await request(app).get('/api/students/export').set('Cookie', authCookie(admin))).status,
    ).toBe(403);
    expect((await request(app).get('/api/students/export')).status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { Subscription } from '../../src/models/Subscription.model';
import { User, type IUser } from '../../src/models/User.model';
import { authCookie, createCourse, createUser, missingId } from '../factories';

import type { UserRole } from '../../src/types/index';

// The database is shared by the whole file: these users are created once.
let superAdmin: IUser;
let admin: IUser;
let payingStudent: IUser;
let freeStudent: IUser;

beforeAll(async () => {
  superAdmin = await createUser('Super Admin', { name: 'Owner Person' });
  admin = await createUser('Admin', { name: 'Admin Person' });
  payingStudent = await createUser('Student', {
    name: 'Paying Student',
    email: 'paying.student@example.com',
  });
  freeStudent = await createUser('Student', { name: 'Free Student' });
  await createUser('Teacher', { name: 'Teacher (dot) Person' });

  const paidCourse = await createCourse({ pricing: 'Paid', price: 500, createdBy: superAdmin._id });
  const freeCourse = await createCourse({ createdBy: superAdmin._id });
  await Enrollment.create([
    {
      student: payingStudent._id,
      course: paidCourse._id,
      enrollmentType: 'paid',
      listPrice: 500,
      paidPrice: 400,
    },
    { student: freeStudent._id, course: freeCourse._id, enrollmentType: 'free' },
  ]);
  const now = new Date();
  await Subscription.create({
    user: payingStudent._id,
    plan: 'Premium',
    startDate: now,
    endDate: new Date(now.getTime() + 86_400_000),
    assignedBy: superAdmin._id,
    pricePaid: 300,
  });
  await User.updateOne(
    { _id: payingStudent._id },
    {
      activeSubscription: {
        plan: 'Premium',
        startDate: now,
        endDate: new Date(now.getTime() + 86_400_000),
      },
    },
  );
});

const list = (user: IUser, query = '') =>
  request(app).get(`/api/users${query}`).set('Cookie', authCookie(user));

describe('GET /api/users', () => {
  it('an Admin gets a page of users (newest first) with totals; no password hashes', async () => {
    const res = await list(admin, '?limit=2');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.totalUsers).toBe(5);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: false,
    });
    expect(JSON.stringify(res.body)).not.toContain('password');
    // Admins get no spending summary (Super Admin only)
    expect(res.body.data[0].spendingSummary).toBeUndefined();
  });

  it('filters by role and searches name/email case-insensitively', async () => {
    const byRole = await list(admin, '?role=Student');
    const bySearch = await list(admin, '?search=PAYING.student');

    expect(byRole.body.total).toBe(2);
    expect(bySearch.body.data.map((u: { _id: string }) => u._id)).toEqual([
      String(payingStudent._id),
    ]);
  });

  it('treats search text literally (regex characters do not match everything or crash)', async () => {
    const dot = await list(admin, `?search=${encodeURIComponent('(dot)')}`);
    const broken = await list(admin, `?search=${encodeURIComponent('([a-z]+)+$')}`);

    expect(dot.status).toBe(200);
    expect(dot.body.total).toBe(1);
    expect(broken.status).toBe(200);
    expect(broken.body.total).toBe(0);
  });

  it('ignores an unknown role filter and caps limit at 100; a page past the end shows the last page', async () => {
    const unknownRole = await list(admin, '?role=Owner');
    const bigLimit = await list(admin, '?limit=1000');
    const farPage = await list(admin, '?limit=2&page=99');

    expect(unknownRole.body.total).toBe(5);
    expect(bigLimit.body.pagination.limit).toBe(100);
    expect(farPage.body.pagination.page).toBe(3);
  });

  it('a Super Admin also gets enrolment and spending summaries per user', async () => {
    const res = await list(superAdmin, '?search=paying.student');

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({
      enrollmentSummary: { free: 0, paid: 1, subscription: 0, total: 1 },
      spendingSummary: { paidCourses: 400, subscriptions: 300, total: 700 },
    });
  });

  it('Super Admin advanced filters: enrolment, spending range and subscription status', async () => {
    const hasPaid = await list(superAdmin, '?enrollmentFilter=has_paid');
    const minSpend = await list(superAdmin, '?minTotalSpent=500');
    const activeSubs = await list(superAdmin, '?subscriptionStatus=active');
    const hasFree = await list(superAdmin, '?enrollmentFilter=has_free');

    expect(hasPaid.body.data.map((u: { _id: string }) => u._id)).toEqual([
      String(payingStudent._id),
    ]);
    expect(minSpend.body.total).toBe(1);
    expect(activeSubs.body.total).toBe(1);
    expect(hasFree.body.data.map((u: { _id: string }) => u._id)).toEqual([String(freeStudent._id)]);
    expect(JSON.stringify(hasPaid.body)).not.toContain('"password"');
  });

  it('advanced filters are ignored for an Admin', async () => {
    const res = await list(admin, '?enrollmentFilter=has_paid');

    expect(res.body.total).toBe(5);
  });

  it('answers 401 without a token and 403 for Moderator, Teacher, Student', async () => {
    expect((await request(app).get('/api/users')).status).toBe(401);
    for (const role of ['Moderator', 'Teacher', 'Student'] as UserRole[]) {
      const actor = await createUser(role);
      const res = await list(actor);
      expect(res.status, role).toBe(403);
      await User.deleteOne({ _id: actor._id });
    }
  });
});

describe('GET /api/users/:id', () => {
  it('an Admin reads one user without the password', async () => {
    const res = await request(app)
      .get(`/api/users/${String(freeStudent._id)}`)
      .set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ _id: String(freeStudent._id), email: freeStudent.email });
    expect(res.body.data.password).toBeUndefined();
  });

  it('answers 404 for a missing id and 400 for a malformed one', async () => {
    const missing = await request(app)
      .get(`/api/users/${missingId()}`)
      .set('Cookie', authCookie(admin));
    const malformed = await request(app).get('/api/users/abc').set('Cookie', authCookie(admin));

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ success: false, message: 'Invalid _id' });
  });

  it('answers 403 for a Student', async () => {
    const res = await request(app)
      .get(`/api/users/${String(freeStudent._id)}`)
      .set('Cookie', authCookie(freeStudent));

    expect(res.status).toBe(403);
  });
});

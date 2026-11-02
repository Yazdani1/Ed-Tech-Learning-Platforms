import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import { Subscription } from '../../src/models/Subscription.model';
import { User } from '../../src/models/User.model';
import {
  authCookie,
  bearer,
  createCourse,
  createUser,
  createUsersForAllRoles,
  missingId,
  nextId,
  ROLES,
} from '../factories';
import { daysAgo, daysFromNow } from '../factories/admin-messaging';

import type { ICourse } from '../../src/models/Course.model';
import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const LIST = '/api/students';
const COURSES = '/api/students/courses';
const ADMIN_ROLES: readonly UserRole[] = ['Super Admin', 'Admin'];

type Row = { _id: string; enrolledCourses: number; totalSpent: number };

let users: Record<UserRole, IUser>;
let tag: string;
let alice: IUser;
let bob: IUser;
let carol: IUser;
let courseA: ICourse;
let courseB: ICourse;
let admin: string;

beforeAll(async () => {
  users = await createUsersForAllRoles();
  admin = authCookie(users.Admin);
  tag = `stu${nextId()}`;
  // Explicit creation times: the "newest first" order never depends on two accounts sharing a millisecond
  alice = await createUser('Student', {
    name: `${tag} Alice`,
    phone: '+880 1711-000000',
    createdAt: daysAgo(3),
  });
  bob = await createUser('Student', { name: `${tag} Bob`, createdAt: daysAgo(2) });
  carol = await createUser('Student', { name: `${tag} Carol`, createdAt: daysAgo(1) });
  // A teacher with the same name tag must never be listed
  await createUser('Teacher', { name: `${tag} Teacher` });
  courseA = await createCourse({ pricing: 'Paid', price: 500, title: `${tag} A` });
  courseB = await createCourse({ title: `${tag} B` });

  await Enrollment.create({
    student: alice._id,
    course: courseA._id,
    enrollmentType: 'paid',
    paidPrice: 400,
  });
  await Enrollment.create({ student: alice._id, course: courseB._id, enrollmentType: 'free' });
  // paidPrice 0: the course price (500) counts
  await Enrollment.create({
    student: bob._id,
    course: courseA._id,
    enrollmentType: 'paid',
    paidPrice: 0,
  });
  await Enrollment.create({ student: carol._id, course: courseB._id, enrollmentType: 'free' });
  await Subscription.create({
    user: alice._id,
    plan: 'Premium',
    pricePaid: 99,
    status: 'Active',
    startDate: new Date(),
    endDate: daysFromNow(30),
    assignedBy: users.Admin._id,
  });
});

const list = (query = '') => request(app).get(`${LIST}?search=${tag}${query}`).set('Cookie', admin);

describe('students: access', () => {
  it.each([LIST, COURSES, `${LIST}/${missingId()}`])('401 without a token on %s', async (url) => {
    const res = await request(app).get(url);
    expect(res.status).toBe(401);
  });

  it.each(
    ROLES.filter((role) => !ADMIN_ROLES.includes(role)).flatMap((role) =>
      [LIST, COURSES, `${LIST}/${missingId()}`].map((url) => [role, url] as const),
    ),
  )('403 for %s on %s', async (role, url) => {
    const res = await request(app).get(url).set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it.each(ADMIN_ROLES)('200 for %s (Bearer header)', async (role) => {
    const res = await request(app).get(LIST).set('Authorization', bearer(users[role]));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/students', () => {
  it('lists only students, newest first, with course count and money spent', async () => {
    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    const rows = res.body.data as Row[];
    expect(rows.map((row) => row._id)).toEqual([
      String(carol._id),
      String(bob._id),
      String(alice._id),
    ]);
    const byId = new Map(rows.map((row) => [row._id, row]));
    // 400 (course) + 99 (subscription)
    expect(byId.get(String(alice._id))).toMatchObject({ enrolledCourses: 2, totalSpent: 499 });
    expect(byId.get(String(bob._id))).toMatchObject({ enrolledCourses: 1, totalSpent: 500 });
    expect(byId.get(String(carol._id))).toMatchObject({ enrolledCourses: 1, totalSpent: 0 });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('filters by one or several courses (enrolled in any of them)', async () => {
    const onlyA = await list(`&courseIds=${courseA._id}`);
    expect(onlyA.body.total).toBe(2);
    const both = await list(`&courseIds=${courseA._id},${courseB._id}`);
    expect(both.body.total).toBe(3);
    const none = await list(`&courseIds=${missingId()}`);
    expect(none.body.total).toBe(0);
  });

  it('finds a student by phone number', async () => {
    const res = await request(app).get(`${LIST}?search=1711-000000`).set('Cookie', admin);
    expect(res.body.data.map((row: Row) => row._id)).toContain(String(alice._id));
  });

  it('pages the list (page, limit) and caps the limit', async () => {
    const res = await list('&page=2&limit=2');
    expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(res.body.data).toHaveLength(1);
    const capped = await list('&limit=5000');
    expect(capped.body.limit).toBe(100);
  });

  it('400 for a malformed course id; an operator object in search is ignored', async () => {
    const bad = await list('&courseIds=abc');
    expect(bad.status).toBe(400);
    expect(bad.body.success).toBe(false);
    const injected = await request(app).get(`${LIST}?search[$ne]=x`).set('Cookie', admin);
    expect(injected.status).toBe(200);
  });
});

describe('GET /api/students/courses', () => {
  it('lists courses with cover, title and enrolled / paid student counts', async () => {
    const res = await request(app).get(COURSES).set('Cookie', admin);
    expect(res.status).toBe(200);
    const find = (id: unknown) =>
      res.body.data.find((course: { _id: string }) => course._id === String(id));
    expect(find(courseA._id)).toMatchObject({
      title: `${tag} A`,
      enrolledStudents: 2,
      paidStudents: 2,
    });
    expect(find(courseB._id)).toMatchObject({ enrolledStudents: 2, paidStudents: 0 });
  });
});

describe('GET /api/students/:id', () => {
  it('returns contact details, courses bought, subscriptions and totals', async () => {
    const res = await request(app).get(`${LIST}/${alice._id}`).set('Cookie', admin);
    expect(res.status).toBe(200);
    const { student, enrollments, subscriptions, totals } = res.body.data;
    expect(student).toMatchObject({ name: `${tag} Alice`, phone: '+880 1711-000000' });
    expect(student.studentNumber).toMatch(/^\d{3}-\d{3}-\d{3}$/);
    expect(student).not.toHaveProperty('password');
    expect(enrollments).toHaveLength(2);
    const paid = enrollments.find((e: { enrollmentType: string }) => e.enrollmentType === 'paid');
    expect(paid).toMatchObject({ amountPaid: 400, course: { title: `${tag} A` } });
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toMatchObject({ plan: 'Premium', amountPaid: 99 });
    expect(totals).toEqual({
      enrolledCourses: 2,
      paidCourses: 1,
      courseSpent: 400,
      subscriptionSpent: 99,
      totalSpent: 499,
    });
  });

  it('404 for an unknown id and for a user who is not a student', async () => {
    const missing = await request(app).get(`${LIST}/${missingId()}`).set('Cookie', admin);
    expect(missing.status).toBe(404);
    const teacher = await request(app).get(`${LIST}/${users.Teacher._id}`).set('Cookie', admin);
    expect(teacher.status).toBe(404);
  });

  it('400 for a malformed id', async () => {
    const res = await request(app).get(`${LIST}/not-an-id`).set('Cookie', admin);
    expect(res.status).toBe(400);
  });

  it('a student with no enrolments or subscriptions has empty lists and zero totals', async () => {
    const lonely = await createUser('Student');
    const res = await request(app).get(`${LIST}/${lonely._id}`).set('Cookie', admin);
    expect(res.status).toBe(200);
    expect(res.body.data.enrollments).toEqual([]);
    expect(res.body.data.subscriptions).toEqual([]);
    expect(res.body.data.totals.totalSpent).toBe(0);
  });
});

describe('GET /api/students: more rules', () => {
  it('finds a student by the 9 digits of the student number, with or without dashes', async () => {
    const saved = await User.findById(alice._id).select('studentNumber').lean();
    const number = saved?.studentNumber ?? '';
    for (const search of [number, number.replace(/-/g, '')]) {
      const res = await request(app).get(`${LIST}?search=${search}`).set('Cookie', admin);
      expect(res.body.data.map((row: Row) => row._id)).toContain(String(alice._id));
    }
  });

  it('a page past the last one shows the last page', async () => {
    const res = await list('&page=99&limit=2');
    expect(res.body).toMatchObject({ total: 3, page: 2 });
    expect(res.body.data).toHaveLength(1);
  });

  it('regex characters in the search are matched literally (no error)', async () => {
    for (const search of ['(', '.*', '[a-']) {
      const res = await request(app)
        .get(`${LIST}?search=${encodeURIComponent(search)}`)
        .set('Cookie', admin);
      expect(res.status).toBe(200);
    }
  });

  it('400 for a repeated courseIds parameter and for more than 500 ids', async () => {
    const repeated = await list(`&courseIds=${courseA._id}&courseIds=${courseB._id}`);
    expect(repeated.status).toBe(400);
    const many = Array.from({ length: 501 }, () => missingId()).join(',');
    const tooMany = await request(app).get(`${LIST}?courseIds=${many}`).set('Cookie', admin);
    expect(tooMany.status).toBe(400);
  });

  it('a subscription-only student counts 0 courses and the subscription as spent', async () => {
    const subscriber = await createUser('Student', { name: `${tag} Sub` });
    await Subscription.create({
      user: subscriber._id,
      plan: 'Premium',
      pricePaid: 250,
      status: 'Active',
      startDate: new Date(),
      endDate: daysFromNow(30),
      assignedBy: users.Admin._id,
    });
    const res = await request(app).get(`${LIST}?search=${tag} Sub`).set('Cookie', admin);
    expect(res.body.data[0]).toMatchObject({ enrolledCourses: 0, totalSpent: 250 });
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import {
  authCookie,
  createCourse,
  createUser,
  createUsersForAllRoles,
  enrol,
  missingId,
  ROLES,
} from '../factories';
import { createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMIN_ONLY: UserRole[] = ['Super Admin', 'Admin'];
const STAFF: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];
const EXPORT_ROLES: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
const without = (allowed: UserRole[]): UserRole[] => ROLES.filter((r) => !allowed.includes(r));

describe('GET /api/enrollments/admin/course/:courseId', () => {
  it('lists the course enrolments with student and course data, never password', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ pricing: 'Paid', price: 100 });
    const other = await createCourse();
    const student = await createUser('Student');
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid' });
    await enrol(await createUser('Student'), other);
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${course._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].student).toMatchObject({ name: student.name, email: student.email });
    expect(res.body.data[0].student.password).toBeUndefined();
    expect(res.body.data[0].course.title).toBe(course.title);
  });

  it('filters by type and ignores an unknown type', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'paid',
    });
    await enrol(await createUser('Student'), course);
    const paid = await request(app)
      .get(`/api/enrollments/admin/course/${course._id}?type=paid`)
      .set('Cookie', authCookie(admin));
    expect(paid.body.total).toBe(1);
    const unknown = await request(app)
      .get(`/api/enrollments/admin/course/${course._id}?type=bogus`)
      .set('Cookie', authCookie(admin));
    expect(unknown.body.total).toBe(2);
  });

  it('does not pass an operator object in type to the query', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await enrol(await createUser('Student'), course);
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${course._id}?type[$ne]=x`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it('400 for a malformed course id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .get('/api/enrollments/admin/course/not-an-id')
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).get(`/api/enrollments/admin/course/${missingId()}`)).status).toBe(
      401,
    );
  });

  it.each(without(ADMIN_ONLY))('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${missingId()}`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments/admin/course/:courseId/stats', () => {
  it('counts per type and sums the earnings from the stored paid price', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ pricing: 'Paid', price: 100 });
    await enrol(await createUser('Student'), course);
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'paid',
      paidPrice: 80,
    });
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'paid',
      paidPrice: 0,
    });
    await Enrollment.create({
      student: (await createUser('Student'))._id,
      course: course._id,
      enrollmentType: 'subscription',
    });
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${course._id}/stats`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 4,
      free: 1,
      paid: 2,
      subscription: 1,
      lifetimeEarned: 180,
      thisMonthCount: 4,
      thisMonthEarned: 180,
    });
  });

  it('returns zeros for a course without enrolments', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${missingId()}/stats`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  it('401 without a token', async () => {
    expect(
      (await request(app).get(`/api/enrollments/admin/course/${missingId()}/stats`)).status,
    ).toBe(401);
  });

  it.each(without(ADMIN_ONLY))('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .get(`/api/enrollments/admin/course/${missingId()}/stats`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments/course/:courseId/students', () => {
  it.each(STAFF.filter((r) => r !== 'Teacher'))('%s sees names and emails', async (role) => {
    const viewer = await createUser(role);
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/students`)
      .set('Cookie', authCookie(viewer));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].student.email).toBe(student.email);
    expect(res.body.data[0].enrollmentType).toBe('free');
  });

  it('the assigned teacher sees names but not emails', async () => {
    const { user, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/students`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.data[0].student.name).toBe(student.name);
    expect(res.body.data[0].student.email).toBeUndefined();
  });

  it('a teacher not assigned to the course gets 403', async () => {
    const { user } = await createTeacherWithCourse();
    const foreign = await createTeacherWithCourse();
    await enrol(await createUser('Student'), foreign.course);
    const res = await request(app)
      .get(`/api/enrollments/course/${foreign.course._id}/students`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
  });

  it('401 without a token', async () => {
    expect((await request(app).get(`/api/enrollments/course/${missingId()}/students`)).status).toBe(
      401,
    );
  });

  it('403 for Student', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/students`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments/course/:courseId/students/export', () => {
  it('returns a CSV attachment with name and email', async () => {
    const admin = await createUser('Moderator');
    const course = await createCourse();
    const student = await createUser('Student', { name: 'Say "hi", Bob' });
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/students/export`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain(`course-${course._id}-students.csv`);
    expect(res.text.split('\n')).toEqual([
      '"Student Name","Email Address"',
      `"Say ""hi"", Bob","${student.email}"`,
    ]);
  });

  it('neutralises spreadsheet formulas in names', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await enrol(await createUser('Student', { name: '=HYPERLINK("http://evil","x")' }), course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/students/export`)
      .set('Cookie', authCookie(admin));
    const dataRow = res.text.split('\n')[1];
    expect(dataRow.startsWith('"=')).toBe(false);
    expect(dataRow.startsWith(`"'=HYPERLINK(`)).toBe(true);
  });

  it.each(['+1+cmd', '-2+cmd', '@SUM(A1)'])(
    'prefixes a quote to a name starting with %j',
    async (name) => {
      const admin = await createUser('Admin');
      const course = await createCourse();
      const student = await createUser('Student', { name });
      await enrol(student, course);
      const res = await request(app)
        .get(`/api/enrollments/course/${course._id}/students/export`)
        .set('Cookie', authCookie(admin));
      expect(res.text.split('\n')[1]).toBe(`"'${name}","${student.email}"`);
    },
  );

  it('401 without a token', async () => {
    expect(
      (await request(app).get(`/api/enrollments/course/${missingId()}/students/export`)).status,
    ).toBe(401);
  });

  it.each(without(EXPORT_ROLES))('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .get(`/api/enrollments/course/${missingId()}/students/export`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments/course/:courseId/count', () => {
  it.each(ROLES)('%s can read the count', async (role) => {
    const viewer = await createUser(role);
    const course = await createCourse();
    await enrol(await createUser('Student'), course);
    await enrol(await createUser('Student'), course);
    const res = await request(app)
      .get(`/api/enrollments/course/${course._id}/count`)
      .set('Cookie', authCookie(viewer));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { count: 2 } });
  });

  it('400 for a malformed course id', async () => {
    const viewer = await createUser('Student');
    const res = await request(app)
      .get('/api/enrollments/course/not-an-id/count')
      .set('Cookie', authCookie(viewer));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).get(`/api/enrollments/course/${missingId()}/count`)).status).toBe(
      401,
    );
  });
});

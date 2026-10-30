import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Enrollment } from '../../src/models/Enrollment.model';
import {
  authCookie,
  bearer,
  createCourse,
  createUser,
  createUsersForAllRoles,
  enrol,
  missingId,
  ROLES,
} from '../factories';

const NON_STUDENT_ROLES = ROLES.filter((role) => role !== 'Student');
const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (days: number): Date => new Date(Date.now() + days * DAY_MS);
const PAUSE_MS = 15;

describe('POST /api/enrollments/:courseId', () => {
  it('enrols a student in a free course and stores a free enrolment with zero prices', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, message: 'Enrolled successfully' });
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved?.enrollmentType).toBe('free');
    expect(saved?.paidPrice).toBe(0);
    expect(saved?.listPrice).toBe(0);
  });

  it('accepts the Bearer header', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Authorization', bearer(student));
    expect(res.status).toBe(201);
  });

  it('takes the price from the database for a paid course', async () => {
    const student = await createUser('Student');
    const course = await createCourse({
      pricing: 'Paid',
      listPrice: 1000,
      discountPrice: 750,
      price: 750,
    });
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(201);
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved).toMatchObject({
      enrollmentType: 'paid',
      listPrice: 1000,
      paidPrice: 750,
      discountAmount: 250,
      discountPercent: 25,
      currency: 'BDT',
    });
  });

  it('ignores prices and types sent by the client', async () => {
    const student = await createUser('Student');
    const course = await createCourse({ pricing: 'Paid', price: 500, listPrice: 500 });
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student))
      .send({ enrollmentType: 'free', paidPrice: 0, listPrice: 0 });
    expect(res.status).toBe(201);
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved?.enrollmentType).toBe('paid');
    expect(saved?.paidPrice).toBe(500);
  });

  it('uses the subscription when the plan is valid and the course allows it', async () => {
    const student = await createUser('Student', {
      activeSubscription: { plan: 'Pro', startDate: new Date(), endDate: inDays(10) },
    });
    const course = await createCourse({
      pricing: 'Paid',
      price: 500,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Pro'],
    });
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(201);
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved?.enrollmentType).toBe('subscription');
    expect(saved?.paidPrice).toBe(0);
  });

  it('does not use an expired subscription', async () => {
    const student = await createUser('Student', {
      activeSubscription: { plan: 'Pro', startDate: inDays(-40), endDate: inDays(-10) },
    });
    const course = await createCourse({
      pricing: 'Paid',
      price: 500,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Pro'],
    });
    await request(app).post(`/api/enrollments/${course._id}`).set('Cookie', authCookie(student));
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved?.enrollmentType).toBe('paid');
  });

  it('does not use a plan the course does not allow', async () => {
    const student = await createUser('Student', {
      activeSubscription: { plan: 'Basic', startDate: new Date(), endDate: inDays(10) },
    });
    const course = await createCourse({
      pricing: 'Paid',
      price: 500,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Pro'],
    });
    await request(app).post(`/api/enrollments/${course._id}`).set('Cookie', authCookie(student));
    const saved = await Enrollment.findOne({ student: student._id, course: course._id });
    expect(saved?.enrollmentType).toBe('paid');
  });

  it('400 when already enrolled, and keeps one enrolment', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    await enrol(student, course);
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Already enrolled in this course');
    expect(await Enrollment.countDocuments({ student: student._id, course: course._id })).toBe(1);
  });

  it('400 for a draft course', async () => {
    const student = await createUser('Student');
    const course = await createCourse({ status: 'Draft' });
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
    expect(await Enrollment.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 for a published but Private course, like a draft', async () => {
    const student = await createUser('Student');
    const course = await createCourse({ visibility: 'Private' });
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This course is not available for enrollment');
    expect(await Enrollment.countDocuments({ course: course._id })).toBe(0);
  });

  it('404 for a missing course', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .post(`/api/enrollments/${missingId()}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Course not found');
  });

  it('400 for a malformed course id', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .post('/api/enrollments/not-an-id')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    const res = await request(app).post(`/api/enrollments/${missingId()}`);
    expect(res.status).toBe(401);
  });

  it.each(NON_STUDENT_ROLES)('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
    expect(await Enrollment.countDocuments({ course: course._id })).toBe(0);
  });
});

describe('DELETE /api/enrollments/:courseId', () => {
  it('removes only the caller enrolment', async () => {
    const student = await createUser('Student');
    const other = await createUser('Student');
    const course = await createCourse();
    await enrol(student, course);
    await enrol(other, course);
    const res = await request(app)
      .delete(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Unenrolled successfully' });
    expect(await Enrollment.countDocuments({ student: student._id, course: course._id })).toBe(0);
    expect(await Enrollment.countDocuments({ student: other._id, course: course._id })).toBe(1);
  });

  it('404 when not enrolled', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    const res = await request(app)
      .delete(`/api/enrollments/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Enrollment not found');
  });

  it('400 for a malformed course id', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .delete('/api/enrollments/not-an-id')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).delete(`/api/enrollments/${missingId()}`)).status).toBe(401);
  });

  it.each(NON_STUDENT_ROLES)('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .delete(`/api/enrollments/${missingId()}`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments (my enrolments)', () => {
  it('lists only my courses, newest first, with the enrolment type and populated category', async () => {
    const student = await createUser('Student');
    const other = await createUser('Student');
    const first = await createCourse();
    const second = await createCourse();
    const foreign = await createCourse();
    await enrol(student, first);
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    await enrol(student, second);
    await enrol(other, foreign);
    const res = await request(app).get('/api/enrollments').set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([
      String(second._id),
      String(first._id),
    ]);
    expect(res.body.data[0].enrollmentType).toBe('free');
    expect(res.body.data[0].category.name).toEqual(expect.any(String));
  });

  it('returns an empty list when nothing is enrolled', async () => {
    const student = await createUser('Student');
    const res = await request(app).get('/api/enrollments').set('Cookie', authCookie(student));
    expect(res.body).toEqual({ success: true, data: [], total: 0 });
  });

  it('401 without a token', async () => {
    expect((await request(app).get('/api/enrollments')).status).toBe(401);
  });

  it.each(NON_STUDENT_ROLES)('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app).get('/api/enrollments').set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

describe('GET /api/enrollments/:courseId/check', () => {
  it('says enrolled with a date, then not enrolled', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    const other = await createCourse();
    await enrol(student, course);
    const yes = await request(app)
      .get(`/api/enrollments/${course._id}/check`)
      .set('Cookie', authCookie(student));
    expect(yes.status).toBe(200);
    expect(yes.body.data.isEnrolled).toBe(true);
    expect(new Date(yes.body.data.enrolledAt).getTime()).not.toBeNaN();
    const no = await request(app)
      .get(`/api/enrollments/${other._id}/check`)
      .set('Cookie', authCookie(student));
    expect(no.body.data).toEqual({ isEnrolled: false, enrolledAt: null });
  });

  it('does not reveal another student enrolment', async () => {
    const student = await createUser('Student');
    const other = await createUser('Student');
    const course = await createCourse();
    await enrol(other, course);
    const res = await request(app)
      .get(`/api/enrollments/${course._id}/check`)
      .set('Cookie', authCookie(student));
    expect(res.body.data.isEnrolled).toBe(false);
  });

  it('400 for a malformed course id', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .get('/api/enrollments/not-an-id/check')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).get(`/api/enrollments/${missingId()}/check`)).status).toBe(401);
  });

  it.each(NON_STUDENT_ROLES)('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .get(`/api/enrollments/${missingId()}/check`)
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

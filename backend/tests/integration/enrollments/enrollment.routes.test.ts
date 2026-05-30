import request from 'supertest';
import app from '../../../src/app';
import { Enrollment } from '../../../src/models/Enrollment.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createSubscriptionPlan, makeObjectId } from '../../helpers/data.helper';

describe('Enrollments API', () => {
  it('enrolls and unenrolls students in free courses', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin, { pricing: 'Free', status: 'Published' });

    const enroll = await request(app).post(`/api/enrollments/${course._id}`).set(authHeaderFor(student));
    expectSuccess(enroll, 201);
    expect(await Enrollment.countDocuments({ student: student._id, course: course._id, enrollmentType: 'free' })).toBe(1);

    const duplicate = await request(app).post(`/api/enrollments/${course._id}`).set(authHeaderFor(student));
    expectError(duplicate, 400, /Already enrolled/);

    const check = await request(app).get(`/api/enrollments/${course._id}/check`).set(authHeaderFor(student));
    expectSuccess(check);
    expect(check.body.data.isEnrolled).toBe(true);

    const mine = await request(app).get('/api/enrollments').set(authHeaderFor(student));
    expectSuccess(mine);
    expect(mine.body.total).toBe(1);

    const unenroll = await request(app).delete(`/api/enrollments/${course._id}`).set(authHeaderFor(student));
    expectSuccess(unenroll);
  });

  it('enrolls paid and subscription courses with correct order snapshots', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const paidStudent = await createTestUser({ role: 'Student', email: 'paid@example.com' });
    const subStudent = await createTestUser({
      role: 'Student',
      email: 'sub@example.com',
      name: 'Subscriber',
    });
    await createSubscriptionPlan(admin);
    const paidCourse = await createCourse(admin, {
      pricing: 'Paid',
      price: 80,
      listPrice: 100,
      discountPrice: 80,
      status: 'Published',
    });
    const subscriptionCourse = await createCourse(admin, {
      pricing: 'Paid',
      price: 100,
      listPrice: 100,
      discountPrice: 100,
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
      status: 'Published',
    });

    await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(subStudent)).send({ plan: 'Premium' });

    const paid = await request(app).post(`/api/enrollments/${paidCourse._id}`).set(authHeaderFor(paidStudent)).send({ enrollmentType: 'paid' });
    expectSuccess(paid, 201);
    const paidEnrollment = await Enrollment.findOne({ student: paidStudent._id, course: paidCourse._id });
    expect(paidEnrollment).toMatchObject({ enrollmentType: 'paid', listPrice: 100, paidPrice: 80, discountAmount: 20, discountPercent: 20 });

    const subscription = await request(app).post(`/api/enrollments/${subscriptionCourse._id}`).set(authHeaderFor(subStudent));
    expectSuccess(subscription, 201);
    const subEnrollment = await Enrollment.findOne({ student: subStudent._id, course: subscriptionCourse._id });
    expect(subEnrollment?.enrollmentType).toBe('subscription');
  });

  it('rejects unavailable courses and missing enrollments', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const draft = await createCourse(admin, { status: 'Draft' });

    const missingCourse = await request(app).post(`/api/enrollments/${makeObjectId()}`).set(authHeaderFor(student));
    expectError(missingCourse, 404, /Course not found/);

    const draftCourse = await request(app).post(`/api/enrollments/${draft._id}`).set(authHeaderFor(student));
    expectError(draftCourse, 400, /not available/);

    const missingEnrollment = await request(app).delete(`/api/enrollments/${draft._id}`).set(authHeaderFor(student));
    expectError(missingEnrollment, 404, /Enrollment not found/);
  });

  it('supports admin and staff enrollment reporting endpoints', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const moderator = await createTestUser({ role: 'Moderator', email: 'mod@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin, { status: 'Published' });
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'free' });

    const adminList = await request(app).get(`/api/enrollments/admin/course/${course._id}?type=free`).set(authHeaderFor(admin));
    expectSuccess(adminList);
    expect(adminList.body.total).toBe(1);

    const stats = await request(app).get(`/api/enrollments/admin/course/${course._id}/stats`).set(authHeaderFor(admin));
    expectSuccess(stats);
    expect(stats.body.data).toMatchObject({ total: 1, free: 1 });

    const students = await request(app).get(`/api/enrollments/course/${course._id}/students`).set(authHeaderFor(moderator));
    expectSuccess(students);
    expect(students.body.total).toBe(1);

    const count = await request(app).get(`/api/enrollments/course/${course._id}/count`).set(authHeaderFor(student));
    expectSuccess(count);
    expect(count.body.data.count).toBe(1);

    const csv = await request(app).get(`/api/enrollments/course/${course._id}/students/export`).set(authHeaderFor(moderator));
    expect(csv.status).toBe(200);
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain('Student Name');
  });
});

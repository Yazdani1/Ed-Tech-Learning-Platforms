import request from 'supertest';
import app from '../../../src/app';
import { Enrollment } from '../../../src/models/Enrollment.model';
import { Question } from '../../../src/models/Question.model';
import { Subscription } from '../../../src/models/Subscription.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectSuccess } from '../../helpers/assertions.helper';
import { createCategory, createCourse, createSubscriptionPlan, createTeacherProfile } from '../../helpers/data.helper';

describe('Dashboard and Performance APIs', () => {
  it('returns dashboard summary with revenue, recent activity, counts, and charts', async () => {
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    await createCategory('Analytics');
    await createTeacherProfile();
    await createSubscriptionPlan(superAdmin);
    const course = await createCourse(superAdmin, { pricing: 'Paid', price: 50, listPrice: 50, discountPrice: 50 });
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid', paidPrice: 50 });
    await Subscription.create({
      user: student._id,
      plan: 'Premium',
      billingDuration: 1,
      billingLabel: 'Monthly',
      pricePaid: 29,
      startDate: new Date(),
      endDate: new Date('2030-01-01'),
      assignedBy: superAdmin._id,
      status: 'Active',
    });
    await Question.create({ course: course._id, title: 'Open', description: 'Question', postedBy: student._id });

    const res = await request(app).get('/api/dashboard/summary').set(authHeaderFor(superAdmin));

    expectSuccess(res);
    expect(res.body.data.totals).toMatchObject({
      users: 2,
      students: 1,
      courses: 1,
      enrollments: 1,
      activeSubscriptions: 1,
      openQuestions: 1,
      totalRevenue: 79,
    });
    expect(res.body.data.revenueTimeline.length).toBeGreaterThan(0);
    expect(res.body.data.topCourses[0].enrollments).toBe(1);
  });

  it('returns performance overview and selectable courses for super admin', async () => {
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const secondStudent = await createTestUser({ role: 'Student', email: 'second@example.com' });
    const course = await createCourse(superAdmin, { pricing: 'Paid', price: 75, listPrice: 75, discountPrice: 75 });
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid', paidPrice: 75 });
    await Enrollment.create({ student: secondStudent._id, course: course._id, enrollmentType: 'free' });

    const overview = await request(app).get(`/api/performance/overview?courseId=${course._id}&dateRange=lifetime`).set(authHeaderFor(superAdmin));
    expectSuccess(overview);
    expect(overview.body.data).toMatchObject({
      totalRevenue: 75,
      totalEnrollments: 2,
      breakdown: { free: 1, paid: 1, subscription: 0 },
    });

    const courses = await request(app).get('/api/performance/courses').set(authHeaderFor(superAdmin));
    expectSuccess(courses);
    expect(courses.body.data).toHaveLength(1);
  });
});

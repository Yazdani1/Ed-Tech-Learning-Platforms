import request from 'supertest';
import app from '../../../src/app';
import { Announcement } from '../../../src/models/Announcement.model';
import { Course } from '../../../src/models/Course.model';
import { Enrollment } from '../../../src/models/Enrollment.model';
import { Section } from '../../../src/models/Section.model';
import { StudyCurriculum } from '../../../src/models/StudyCurriculum.model';
import { Subscription } from '../../../src/models/Subscription.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import {
  createCategory,
  createCourse,
  createCoursePrerequisites,
  createCourseType,
  createSubscriptionPlan,
  createTeacherProfile,
  makeObjectId,
} from '../../helpers/data.helper';

describe('Course API edge coverage', () => {
  it('expires stale discounts when listing courses and supports every public browse filter branch', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const category = await createCategory('Filter Category');
    const courseType = await createCourseType('Filter Type');
    const teacher = await createTeacherProfile();
    const expired = await createCourse(admin, {
      title: 'Expired Discount',
      category: category._id,
      courseType: courseType._id,
      teachers: [teacher._id],
      pricing: 'Paid',
      price: 50,
      listPrice: 100,
      discountPrice: 50,
      discountPercent: 50,
      discountEndsAt: new Date('2020-01-01T00:00:00.000Z'),
      includedInSubscription: true,
      allowedSubscriptionPlans: ['Premium'],
      status: 'Published',
      visibility: 'Public',
    });

    const list = await request(app).get(
      `/api/courses?category=${category._id}&courseType=${courseType._id}&teacher=${teacher._id}&status=Published&pricing=Paid&visibility=Public&subscriptionPlans=Premium&search=Expired`,
    );
    expectSuccess(list);
    expect(list.body.total).toBe(1);
    const refreshed = await Course.findById(expired._id);
    expect(refreshed?.discountPercent).toBe(0);
    expect(refreshed?.price).toBe(100);

    const browseUnpaginated = await request(app).get(
      `/api/courses/browse?search=Expired&courseTypes=${courseType._id},bad-id&categories=${category._id},bad-id&pricing=Paid,Bad&subscriptionPlans=Premium`,
    );
    expectSuccess(browseUnpaginated);
    expect(browseUnpaginated.body.total).toBe(1);
  });

  it('covers create/update branches for teachers, arrays, dates, cover replacement, and free pricing normalization', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const { category, courseType } = await createCoursePrerequisites();
    const teacher = await createTeacherProfile();

    const create = await request(app)
      .post('/api/courses')
      .set(authHeaderFor(admin))
      .field('title', 'Branch Course')
      .field('category', String(category._id))
      .field('courseType', String(courseType._id))
      .field('teachers', JSON.stringify([String(teacher._id)]))
      .field('pricing', 'Free')
      .field('price', '100')
      .field('startDate', '2030-01-01T00:00:00.000Z')
      .field('endDate', '2030-02-01T00:00:00.000Z')
      .field('allowedSubscriptionPlans', JSON.stringify(['Premium']));
    expectSuccess(create, 201);
    expect(create.body.data.price).toBe(0);

    const nextCategory = await createCategory('Next Category');
    const nextType = await createCourseType('Next Type');
    const update = await request(app)
      .put(`/api/courses/${create.body.data._id}`)
      .set(authHeaderFor(admin))
      .field('title', 'Branch Updated')
      .field('subtitle', 'Subtitle')
      .field('description', 'Description')
      .field('category', String(nextCategory._id))
      .field('courseType', String(nextType._id))
      .field('startDate', '')
      .field('endDate', '')
      .field('includedInSubscription', 'true')
      .field('teachers', JSON.stringify([String(teacher._id)]))
      .field('allowedSubscriptionPlans', JSON.stringify(['Premium']))
      .field('whatYouWillLearn', JSON.stringify(['Test APIs']))
      .field('whatYouWillGet', JSON.stringify(['Confidence']))
      .field('requirements', JSON.stringify(['Node.js']))
      .attach('coverImage', Buffer.from('image'), { filename: 'cover.png', contentType: 'image/png' });
    expectSuccess(update);
    expect(update.body.data).toMatchObject({
      title: 'Branch Updated',
      includedInSubscription: true,
      coverImage: expect.stringContaining('cloudinary.com'),
      whatYouWillLearn: ['Test APIs'],
    });
  });

  it('covers bulk update announcements, null fields, invalid fields, not found selections, and discount edge failures', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const category = await createCategory('Bulk Category');
    const teacher = await createTeacherProfile();
    const course = await createCourse(admin, {
      pricing: 'Paid',
      price: 100,
      listPrice: 100,
      discountPrice: 100,
      coverImagePublicId: 'old/course',
    });

    const bulk = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: {
        courseType: null,
        category: String(category._id),
        startDate: null,
        endDate: null,
        status: 'Draft',
        visibility: 'Private',
        pricing: 'Free',
        price: 0,
        includedInSubscription: true,
        allowedSubscriptionPlans: ['Premium'],
        teachers: [String(teacher._id)],
      },
      announcement: { title: 'Bulk note', description: 'Bulk description' },
    });
    expectSuccess(bulk);
    expect(await Announcement.countDocuments({ course: course._id })).toBe(1);

    const missingSelection = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [makeObjectId()],
      updates: { status: 'Published' },
    });
    expectError(missingSelection, 404, /One or more courses were not found/);

    const invalidCategory = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { category: 'bad-id' },
    });
    expectError(invalidCategory, 400, /Invalid category ID/);

    const invalidVisibility = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { visibility: 'Hidden' },
    });
    expectError(invalidVisibility, 400, /Visibility must be Public or Private/);

    const missingPaidPrice = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { pricing: 'Paid' },
    });
    expectError(missingPaidPrice, 400, /Price is required/);

    const invalidTeacher = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { teachers: ['bad-id'] },
    });
    expectError(invalidTeacher, 400, /Invalid teacher ID/);

    const missingAnnouncementTitle = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      announcement: { title: '', description: 'Body' },
    });
    expectError(missingAnnouncementTitle, 400, /Announcement title is required/);

    const missingDiscountSelection = await request(app).patch('/api/courses/bulk/discount').set(authHeaderFor(admin)).send({
      courseIds: [makeObjectId()],
      discountPercent: 20,
      discountEndsAt: '2030-01-01T00:00:00.000Z',
    });
    expectError(missingDiscountSelection, 404, /One or more courses were not found/);

    const freeCourse = await createCourse(admin, { pricing: 'Free', price: 0, listPrice: 0 });
    const noPrice = await request(app).patch('/api/courses/bulk/discount').set(authHeaderFor(admin)).send({
      courseIds: [String(freeCourse._id)],
      discountPercent: 20,
      discountEndsAt: '2030-01-01T00:00:00.000Z',
    });
    expectError(noPrice, 400, /positive list price/);

    const section = await Section.create({ course: course._id, title: 'S', order: 0 });
    await StudyCurriculum.create({
      course: course._id,
      title: 'Live',
      description: 'D',
      weekName: 'W',
      lectures: [],
      postedBy: admin._id,
    });
    course.sections.push(section._id);
    await course.save();
    const remove = await request(app).delete(`/api/courses/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });
});

describe('Users API advanced filter coverage', () => {
  it('covers non-super-admin list response and advanced super-admin aggregation filters', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'advanced.student@example.com' });
    student.activeSubscription = {
      plan: 'Premium',
      billingDuration: 1,
      billingLabel: 'Monthly',
      startDate: new Date(),
      endDate: new Date('2030-01-01T00:00:00.000Z'),
    };
    await student.save();
    await createSubscriptionPlan(superAdmin);
    const course = await createCourse(superAdmin, { pricing: 'Paid', price: 40, listPrice: 40, discountPrice: 40 });
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid', paidPrice: 40 });
    await Subscription.create({
      user: student._id,
      plan: 'Premium',
      billingDuration: 1,
      billingLabel: 'Monthly',
      pricePaid: 29,
      startDate: new Date(),
      endDate: new Date('2030-01-01T00:00:00.000Z'),
      assignedBy: superAdmin._id,
      status: 'Active',
    });

    const adminList = await request(app).get('/api/users?page=99&limit=1').set(authHeaderFor(admin));
    expectSuccess(adminList);
    expect(adminList.body.pagination.hasPrevPage).toBe(true);

    const advanced = await request(app)
      .get('/api/users?subscriptionPlan=Premium&subscriptionStatus=active&enrollmentFilter=has_paid&spendingFilter=has_total&minTotalSpent=1&maxTotalSpent=100&minPaidCourseSpend=1&maxPaidCourseSpend=50&minSubscriptionSpend=1&maxSubscriptionSpend=50')
      .set(authHeaderFor(superAdmin));
    expectSuccess(advanced);
    expect(advanced.body.total).toBe(1);
    expect(advanced.body.data[0].spendingSummary.total).toBe(69);

    const noneAdvanced = await request(app)
      .get('/api/users?subscriptionStatus=inactive&enrollmentFilter=none_total&spendingFilter=none_total')
      .set(authHeaderFor(superAdmin));
    expectSuccess(noneAdvanced);
    expect(noneAdvanced.body.data.every((user: { enrollmentSummary: { total: number } }) => user.enrollmentSummary.total === 0)).toBe(true);
  });

  it('covers update user password branch and empty email validation', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const user = await createTestUser({ role: 'Student', email: 'update-password@example.com' });

    const emptyEmail = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ email: '   ' });
    expectError(emptyEmail, 400, /Email is required/);

    const password = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ password: 'NewPassword123!' });
    expectSuccess(password);
  });
});

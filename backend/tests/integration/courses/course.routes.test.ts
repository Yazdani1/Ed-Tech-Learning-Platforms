import request from 'supertest';
import app from '../../../src/app';
import { Course } from '../../../src/models/Course.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createCoursePrerequisites, makeObjectId } from '../../helpers/data.helper';

describe('Courses API', () => {
  it('lists public/admin courses, browses published public courses, and gets one course', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const published = await createCourse(admin, { title: 'Public Published', status: 'Published', visibility: 'Public' });
    await createCourse(admin, { title: 'Private Draft', status: 'Draft', visibility: 'Private' });

    const all = await request(app).get('/api/courses?search=Public');
    expectSuccess(all);
    expect(all.body.total).toBe(1);

    const browse = await request(app).get('/api/courses/browse?page=1&limit=5&pricing=Free');
    expectSuccess(browse);
    expect(browse.body.total).toBe(1);
    expect(browse.body.filterCounts).toBeDefined();
    expect(browse.body.pagination).toMatchObject({ page: 1, limit: 5 });

    const getOne = await request(app).get(`/api/courses/${published._id}`);
    expectSuccess(getOne);
    expect(getOne.body.data.title).toBe('Public Published');
  });

  it('creates a course with valid data and mocked image upload', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const { category, courseType } = await createCoursePrerequisites();

    const res = await request(app)
      .post('/api/courses')
      .set(authHeaderFor(admin))
      .field('title', 'API Testing Mastery')
      .field('subtitle', 'Confidence for backend releases')
      .field('category', String(category._id))
      .field('courseType', String(courseType._id))
      .field('visibility', 'Public')
      .field('pricing', 'Paid')
      .field('listPrice', '120')
      .field('discountPrice', '80')
      .field('includedInSubscription', 'true')
      .field('allowedSubscriptionPlans', JSON.stringify(['Premium']))
      .attach('coverImage', Buffer.from('fake image'), {
        filename: 'cover.png',
        contentType: 'image/png',
      });

    expectSuccess(res, 201);
    expect(res.body.data).toMatchObject({
      title: 'API Testing Mastery',
      pricing: 'Paid',
      listPrice: 120,
      discountPrice: 80,
      price: 80,
      includedInSubscription: true,
      coverImage: expect.stringContaining('cloudinary.com'),
    });
  });

  it('rejects missing create fields, invalid image type, and non-admin create access', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });

    const missing = await request(app).post('/api/courses').set(authHeaderFor(admin)).send({ title: 'Incomplete' });
    expectError(missing, 400, /Title, category, and course type are required/);

    const invalidFile = await request(app)
      .post('/api/courses')
      .set(authHeaderFor(admin))
      .attach('coverImage', Buffer.from('not image'), { filename: 'notes.txt', contentType: 'text/plain' });
    expectError(invalidFile, 400, /Only image files are allowed/);

    const unauthorized = await request(app).post('/api/courses').set(authHeaderFor(student)).send({});
    expectError(unauthorized, 403, /not authorized/);
  });

  it('updates courses, validates status, and handles missing or malformed ids', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin, { status: 'Draft', visibility: 'Private' });

    const update = await request(app).put(`/api/courses/${course._id}`).set(authHeaderFor(admin)).send({
      title: 'Updated Title',
      pricing: 'Paid',
      listPrice: '200',
      discountPrice: '150',
      visibility: 'Public',
    });
    expectSuccess(update);
    expect(update.body.data).toMatchObject({ title: 'Updated Title', price: 150, visibility: 'Public' });

    const publish = await request(app).patch(`/api/courses/${course._id}/status`).set(authHeaderFor(admin)).send({ status: 'Published' });
    expectSuccess(publish);
    expect(publish.body.data.status).toBe('Published');
    expect(publish.body.data.publishedAt).toBeTruthy();

    const invalidStatus = await request(app).patch(`/api/courses/${course._id}/status`).set(authHeaderFor(admin)).send({ status: 'Archived' });
    expectError(invalidStatus, 400, /Invalid status/);

    const invalidId = await request(app).get('/api/courses/not-an-id');
    expectError(invalidId, 400, /Invalid _id/);

    const missing = await request(app).put(`/api/courses/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'Missing' });
    expectError(missing, 404, /Course not found/);
  });

  it('bulk updates courses and rejects empty, invalid, or missing selections', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin, { status: 'Draft', visibility: 'Private' });

    const success = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { status: 'Published', visibility: 'Public' },
    });
    expectSuccess(success);
    expect(success.body.updatedCount).toBe(1);

    const empty = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({ courseIds: [], updates: { status: 'Published' } });
    expectError(empty, 400, /courseIds must be a non-empty array/);

    const invalidId = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({ courseIds: ['bad-id'], updates: { status: 'Published' } });
    expectError(invalidId, 400, /Invalid course ID/);

    const noWork = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({ courseIds: [String(course._id)] });
    expectError(noWork, 400, /Provide at least one field/);

    const invalidStatus = await request(app).patch('/api/courses/bulk').set(authHeaderFor(admin)).send({
      courseIds: [String(course._id)],
      updates: { status: 'Archived' },
    });
    expectError(invalidStatus, 400, /Status must be Draft or Published/);
  });

  it('applies discounts with boundary validation and deletes courses with related cleanup path', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const paidCourse = await createCourse(admin, {
      pricing: 'Paid',
      price: 100,
      listPrice: 100,
      discountPrice: 100,
    });

    const success = await request(app).patch('/api/courses/bulk/discount').set(authHeaderFor(admin)).send({
      courseIds: [String(paidCourse._id)],
      discountPercent: 25,
      discountEndsAt: '2030-01-01T00:00:00.000Z',
    });
    expectSuccess(success);
    expect(success.body.data.discountPercent).toBe(25);

    const tooHigh = await request(app).patch('/api/courses/bulk/discount').set(authHeaderFor(admin)).send({
      courseIds: [String(paidCourse._id)],
      discountPercent: 100,
      discountEndsAt: '2030-01-01T00:00:00.000Z',
    });
    expectError(tooHigh, 400, /between 1 and 99/);

    const pastDate = await request(app).patch('/api/courses/bulk/discount').set(authHeaderFor(admin)).send({
      courseIds: [String(paidCourse._id)],
      discountPercent: 25,
      discountEndsAt: '2020-01-01T00:00:00.000Z',
    });
    expectError(pastDate, 400, /must be in the future/);

    const summary = await request(app).get('/api/courses/discounts/active');
    expectSuccess(summary);
    expect(summary.body.data).toMatchObject({ courseCount: 1, discountPercent: 25 });

    const remove = await request(app).delete(`/api/courses/${paidCourse._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(await Course.findById(paidCourse._id)).toBeNull();
  });
});

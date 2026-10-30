import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { Course } from '../../src/models/Course.model';
import {
  authCookie,
  bearer,
  createCategory,
  createCourse,
  createCourseType,
  createTeacherProfile,
  createUser,
  missingId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';

const HOUR_MS = 60 * 60 * 1000;
const inFuture = (): string => new Date(Date.now() + 24 * HOUR_MS).toISOString();

const bulk = (user: Awaited<ReturnType<typeof createUser>>, body: Record<string, unknown>) =>
  request(app).patch('/api/courses/bulk').set('Cookie', authCookie(user)).send(body);

describe('PATCH /api/courses/bulk', () => {
  it.each(ADMIN_ROLES)('lets %s update several courses at once', async (role) => {
    const admin = await createUser(role);
    const a = await createCourse({ status: 'Draft', visibility: 'Private' });
    const b = await createCourse({ status: 'Draft', visibility: 'Private' });
    const category = await createCategory();
    const type = await createCourseType();
    const teacher = await createTeacherProfile();

    const res = await bulk(admin, {
      courseIds: [String(a._id), String(b._id)],
      updates: {
        status: 'Published',
        visibility: 'Public',
        category: String(category._id),
        courseType: String(type._id),
        teachers: [String(teacher._id)],
        includedInSubscription: true,
        allowedSubscriptionPlans: ['Gold'],
        startDate: '2032-01-01',
        endDate: '2032-06-01',
      },
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Successfully updated 2 courses',
      updatedCount: 2,
    });
    for (const course of [a, b]) {
      const saved = await Course.findById(course._id);
      expect(saved).toMatchObject({
        status: 'Published',
        visibility: 'Public',
        includedInSubscription: true,
      });
      expect(saved?.publishedAt).toBeInstanceOf(Date);
      expect(String(saved?.category)).toBe(String(category._id));
      expect(String(saved?.courseType)).toBe(String(type._id));
      expect(saved?.teachers.map(String)).toEqual([String(teacher._id)]);
      expect(saved?.allowedSubscriptionPlans).toEqual(['Gold']);
      expect(saved?.startDate?.toISOString()).toBe('2032-01-01T00:00:00.000Z');
    }
  });

  it('uses the singular message for one course and leaves other courses alone', async () => {
    const admin = await createUser('Admin');
    const target = await createCourse({ visibility: 'Public' });
    const untouched = await createCourse({ visibility: 'Public' });
    const res = await bulk(admin, {
      courseIds: [String(target._id)],
      updates: { visibility: 'Private' },
    });
    expect(res.body.message).toBe('Successfully updated 1 course');
    expect((await Course.findById(target._id))?.visibility).toBe('Private');
    expect((await Course.findById(untouched._id))?.visibility).toBe('Public');
  });

  it('unpublishing clears publishedAt', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ publishedAt: new Date() });
    await bulk(admin, { courseIds: [String(course._id)], updates: { status: 'Draft' } });
    const saved = await Course.findById(course._id);
    expect(saved?.status).toBe('Draft');
    expect(saved?.publishedAt ?? null).toBeNull();
  });

  it('posts an announcement to every selected course, as the signed-in user', async () => {
    const admin = await createUser('Admin');
    const a = await createCourse();
    const b = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(a._id), String(b._id)],
      announcement: { title: ' Hello ', description: ' Welcome all ' },
    });
    expect(res.status).toBe(200);
    for (const course of [a, b]) {
      const posts = await Announcement.find({ course: course._id });
      expect(posts).toHaveLength(1);
      expect(posts[0]).toMatchObject({ title: 'Hello', description: 'Welcome all' });
      expect(String(posts[0].postedBy)).toBe(String(admin._id));
    }
  });

  it('applies updates and the announcement together', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ visibility: 'Public' });
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Private' },
      announcement: { title: 'T', description: 'D' },
    });
    expect(res.status).toBe(200);
    expect((await Course.findById(course._id))?.visibility).toBe('Private');
    expect(await Announcement.countDocuments({ course: course._id })).toBe(1);
  });

  it('answers 400 for an invalid announcement and changes nothing (all or nothing)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ visibility: 'Public' });
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Private' },
      announcement: { title: 'Has title', description: '   ' },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Announcement description is required');
    expect((await Course.findById(course._id))?.visibility).toBe('Public');
    expect(await Announcement.countDocuments({ course: course._id })).toBe(0);
  });

  it('answers 400 when the announcement title is blank', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      announcement: { title: ' ', description: 'D' },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Announcement title is required');
  });

  it('answers 400 when courseIds is missing, empty or not an array', async () => {
    const admin = await createUser('Admin');
    for (const courseIds of [undefined, [], 'abc', { $ne: null }]) {
      const res = await bulk(admin, { courseIds, updates: { status: 'Draft' } });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('courseIds must be a non-empty array');
    }
  });

  it('answers 400 when neither updates nor an announcement is given', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, { courseIds: [String(course._id)] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Provide at least one field to update or an announcement');
  });

  it('answers 400 for a malformed course id and 404 for an unknown course', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const bad = await bulk(admin, { courseIds: ['nope'], updates: { status: 'Draft' } });
    expect(bad.status).toBe(400);
    const missing = await bulk(admin, {
      courseIds: [String(course._id), missingId()],
      updates: { visibility: 'Private' },
    });
    expect(missing.status).toBe(404);
    expect((await Course.findById(course._id))?.visibility).toBe('Public');
  });

  it('answers 400 for invalid update values', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const ids = [String(course._id)];
    const invalid: Record<string, unknown>[] = [
      { status: 'Archived' },
      { visibility: 'Secret' },
      { pricing: 'Gold' },
      { pricing: 'Paid' },
      { category: 'nope' },
      { courseType: 'nope' },
      { teachers: ['nope'] },
      { price: -5 },
      { price: 'abc' },
    ];
    for (const updates of invalid) {
      const res = await bulk(admin, { courseIds: ids, updates });
      expect(res.status, JSON.stringify(updates)).toBe(400);
    }
  });

  it('keeps a Free course free: bulk Paid sets the list, discount and final price together', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { pricing: 'Paid', price: 120 },
    });
    expect(res.status).toBe(200);
    const saved = await Course.findById(course._id);
    expect(saved).toMatchObject({ pricing: 'Paid', price: 120 });
    expect(saved?.listPrice).toBe(120);
    expect(saved?.discountPrice).toBe(120);
  });

  it('a price without a pricing change only reprices the Paid courses; Free zeroes all prices', async () => {
    const admin = await createUser('Admin');
    const paid = await createCourse({
      pricing: 'Paid',
      price: 10,
      listPrice: 10,
      discountPrice: 10,
    });
    const free = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(paid._id), String(free._id)],
      updates: { price: 70 },
    });
    expect(res.status).toBe(200);
    expect(await Course.findById(paid._id)).toMatchObject({
      price: 70,
      listPrice: 70,
      discountPrice: 70,
    });
    expect((await Course.findById(free._id))?.price ?? 0).toBe(0);

    await bulk(admin, { courseIds: [String(paid._id)], updates: { pricing: 'Free' } });
    expect(await Course.findById(paid._id)).toMatchObject({
      pricing: 'Free',
      price: 0,
      listPrice: 0,
      discountPrice: 0,
    });
  });

  it('answers 400 for an invalid update and posts no announcement (validated before any write)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Secret' },
      announcement: { title: 'T', description: 'D' },
    });
    expect(res.status).toBe(400);
    expect(await Announcement.countDocuments({ course: course._id })).toBe(0);
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .patch('/api/courses/bulk')
      .set('Authorization', bearer(admin))
      .send({ courseIds: [String(course._id)], updates: { visibility: 'Private' } });
    expect(res.status).toBe(200);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app)
      .patch('/api/courses/bulk')
      .send({ courseIds: [missingId()] });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and changes nothing', async (role) => {
    const user = await createUser(role);
    const course = await createCourse({ visibility: 'Public' });
    const res = await bulk(user, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Private' },
    });
    expect(res.status).toBe(403);
    expect((await Course.findById(course._id))?.visibility).toBe('Public');
  });
});

describe('PATCH /api/courses/bulk/discount', () => {
  const discount = (user: Awaited<ReturnType<typeof createUser>>, body: Record<string, unknown>) =>
    request(app).patch('/api/courses/bulk/discount').set('Cookie', authCookie(user)).send(body);

  const paidCourse = (listPrice: number) =>
    createCourse({ pricing: 'Paid', listPrice, price: listPrice, discountPrice: listPrice });

  it.each(ADMIN_ROLES)(
    'lets %s apply a percentage discount computed from the list price',
    async (role) => {
      const admin = await createUser(role);
      const a = await paidCourse(100);
      const b = await paidCourse(333);
      const endsAt = inFuture();

      const res = await discount(admin, {
        courseIds: [String(a._id), String(b._id)],
        discountPercent: 25,
        discountEndsAt: endsAt,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: 'Discount applied to 2 courses',
        updatedCount: 2,
        data: { courseCount: 2, discountPercent: 25, discountEndsAt: endsAt },
      });
      const savedA = await Course.findById(a._id);
      expect(savedA).toMatchObject({
        listPrice: 100,
        discountPrice: 75,
        price: 75,
        discountPercent: 25,
      });
      expect(savedA?.discountEndsAt?.toISOString()).toBe(endsAt);
      const savedB = await Course.findById(b._id);
      expect(savedB).toMatchObject({ listPrice: 333, discountPrice: 249.75, price: 249.75 });
    },
  );

  it('ignores a price sent by the client (the price comes from the database)', async () => {
    const admin = await createUser('Admin');
    const course = await paidCourse(200);
    await discount(admin, {
      courseIds: [String(course._id)],
      discountPercent: 50,
      discountEndsAt: inFuture(),
      price: 1,
      listPrice: 1,
    });
    expect(await Course.findById(course._id)).toMatchObject({ listPrice: 200, price: 100 });
  });

  it('uses the singular message for one course', async () => {
    const admin = await createUser('Admin');
    const course = await paidCourse(10);
    const res = await discount(admin, {
      courseIds: [String(course._id)],
      discountPercent: 10,
      discountEndsAt: inFuture(),
    });
    expect(res.body.message).toBe('Discount applied to 1 course');
  });

  it('answers 400 for a bad percentage (0, 100, negative, text, missing)', async () => {
    const admin = await createUser('Admin');
    const course = await paidCourse(100);
    for (const discountPercent of [0, 100, -5, 150, 'abc', undefined, null]) {
      const res = await discount(admin, {
        courseIds: [String(course._id)],
        discountPercent,
        discountEndsAt: inFuture(),
      });
      expect(res.status, String(discountPercent)).toBe(400);
    }
    expect((await Course.findById(course._id))?.discountPercent ?? 0).toBe(0);
  });

  it('answers 400 for an end date that is missing, invalid or not in the future', async () => {
    const admin = await createUser('Admin');
    const course = await paidCourse(100);
    for (const discountEndsAt of [
      undefined,
      'not a date',
      new Date(Date.now() - HOUR_MS).toISOString(),
    ]) {
      const res = await discount(admin, {
        courseIds: [String(course._id)],
        discountPercent: 10,
        discountEndsAt,
      });
      expect(res.status, String(discountEndsAt)).toBe(400);
    }
  });

  it('answers 400 when courseIds is empty or has a malformed id', async () => {
    const admin = await createUser('Admin');
    const body = { discountPercent: 10, discountEndsAt: inFuture() };
    expect((await discount(admin, { ...body, courseIds: [] })).status).toBe(400);
    expect((await discount(admin, { ...body, courseIds: ['nope'] })).status).toBe(400);
    expect((await discount(admin, body)).status).toBe(400);
  });

  it('answers 404 when a course is unknown and changes nothing', async () => {
    const admin = await createUser('Admin');
    const course = await paidCourse(100);
    const res = await discount(admin, {
      courseIds: [String(course._id), missingId()],
      discountPercent: 10,
      discountEndsAt: inFuture(),
    });
    expect(res.status).toBe(404);
    expect((await Course.findById(course._id))?.discountPercent ?? 0).toBe(0);
  });

  it('answers 400 and changes no course when one selected course has no list price', async () => {
    const admin = await createUser('Admin');
    const paid = await paidCourse(100);
    const free = await createCourse();
    const res = await discount(admin, {
      courseIds: [String(paid._id), String(free._id)],
      discountPercent: 10,
      discountEndsAt: inFuture(),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('All selected courses must have a positive list price');
    expect((await Course.findById(paid._id))?.price).toBe(100);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).patch('/api/courses/bulk/discount').send({});
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and changes nothing', async (role) => {
    const user = await createUser(role);
    const course = await paidCourse(100);
    const res = await discount(user, {
      courseIds: [String(course._id)],
      discountPercent: 10,
      discountEndsAt: inFuture(),
    });
    expect(res.status).toBe(403);
    expect((await Course.findById(course._id))?.price).toBe(100);
  });
});

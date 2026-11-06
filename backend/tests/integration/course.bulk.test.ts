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

  it('no longer accepts an announcement (it is only an update request now)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ visibility: 'Public' });
    const only = await bulk(admin, {
      courseIds: [String(course._id)],
      announcement: { title: 'Hello', description: 'Welcome all' },
    });
    expect(only.status).toBe(400);
    expect(only.body.message).toBe('Provide at least one field to update');

    const withUpdates = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Private' },
      announcement: { title: 'Hello', description: 'Welcome all' },
    });
    expect(withUpdates.status).toBe(200);
    expect(await Announcement.countDocuments({ course: course._id })).toBe(0);
  });

  it('sets firstPublishedAt once when a bulk update publishes a course', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft', visibility: 'Private' });
    await bulk(admin, { courseIds: [String(course._id)], updates: { status: 'Published' } });
    const first = (await Course.findById(course._id))?.firstPublishedAt;
    expect(first).toBeInstanceOf(Date);

    await bulk(admin, { courseIds: [String(course._id)], updates: { status: 'Draft' } });
    await bulk(admin, { courseIds: [String(course._id)], updates: { status: 'Published' } });
    expect((await Course.findById(course._id))?.firstPublishedAt?.getTime()).toBe(first?.getTime());
  });

  it('answers 400 when courseIds is missing, empty or not an array', async () => {
    const admin = await createUser('Admin');
    for (const courseIds of [undefined, [], 'abc', { $ne: null }]) {
      const res = await bulk(admin, { courseIds, updates: { status: 'Draft' } });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('courseIds must be a non-empty array');
    }
  });

  it('answers 400 when no updates are given', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, { courseIds: [String(course._id)] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Provide at least one field to update');
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

  it('answers 400 for an invalid update and changes nothing (validated before any write)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await bulk(admin, {
      courseIds: [String(course._id)],
      updates: { visibility: 'Secret' },
    });
    expect(res.status).toBe(400);
    expect((await Course.findById(course._id))?.visibility).toBe('Public');
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

describe('removed bulk discount route', () => {
  it('PATCH /api/courses/bulk/discount no longer exists', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .patch('/api/courses/bulk/discount')
      .set('Cookie', authCookie(admin))
      .send({
        courseIds: [missingId()],
        discountPercent: 10,
        discountEndsAt: new Date().toISOString(),
      });
    expect(res.status).toBe(404);
  });
});

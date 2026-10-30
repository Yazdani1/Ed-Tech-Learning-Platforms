import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { Course } from '../../src/models/Course.model';
import { Lecture } from '../../src/models/Lecture.model';
import { Section } from '../../src/models/Section.model';
import { StudyCurriculum } from '../../src/models/StudyCurriculum.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCategory,
  createCourse,
  createCourseType,
  createTeacherProfile,
  createUser,
  missingId,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES, createLecture, createSection } from '../factories/catalog';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => {
  vi.restoreAllMocks();
});

const validBody = async () => ({
  title: `New course ${nextId()}`,
  category: String((await createCategory())._id),
  courseType: String((await createCourseType())._id),
});

describe('POST /api/courses', () => {
  it.each(ADMIN_ROLES)('lets %s create a Draft course owned by them', async (role) => {
    const admin = await createUser(role);
    const body = await validBody();
    const teacher = await createTeacherProfile();

    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({
        ...body,
        subtitle: 'Sub',
        visibility: 'Public',
        teachers: JSON.stringify([String(teacher._id)]),
        startDate: '2030-01-01',
        includedInSubscription: 'true',
        allowedSubscriptionPlans: JSON.stringify(['Premium']),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Course created' });
    const saved = await Course.findById(res.body.data._id);
    expect(saved).toMatchObject({
      title: body.title,
      subtitle: 'Sub',
      status: 'Draft',
      visibility: 'Public',
      pricing: 'Free',
      price: 0,
      includedInSubscription: true,
    });
    expect(String(saved?.createdBy)).toBe(String(admin._id));
    expect(saved?.teachers.map(String)).toEqual([String(teacher._id)]);
    expect(saved?.allowedSubscriptionPlans).toEqual(['Premium']);
    expect(saved?.startDate?.toISOString()).toBe('2030-01-01T00:00:00.000Z');
  });

  it('defaults visibility to Private and ignores a status sent by the client', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({ ...(await validBody()), status: 'Published' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ visibility: 'Private', status: 'Draft' });
  });

  it('uploads the cover image to Cloudinary (multipart) and stores URL and public id', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const body = await validBody();
    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .field('title', body.title)
      .field('category', body.category)
      .field('courseType', body.courseType)
      .attach('coverImage', PNG_BYTES, { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(cloud.upload).toHaveBeenCalledTimes(1);
    expect(res.body.data.coverImage).toContain('https://res.cloudinary.com/');
    const saved = await Course.findById(res.body.data._id).select('+coverImagePublicId');
    expect(saved?.coverImagePublicId).toBeTruthy();
  });

  it('rejects a non-image upload and a fake image', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const body = await validBody();
    const attach = (content: Buffer, contentType: string) =>
      request(app)
        .post('/api/courses')
        .set('Cookie', authCookie(admin))
        .field('title', body.title)
        .field('category', body.category)
        .field('courseType', body.courseType)
        .attach('coverImage', content, { filename: 'f.bin', contentType });
    expect((await attach(Buffer.from('hello'), 'text/plain')).status).toBe(400);
    expect((await attach(Buffer.from('<html></html>'), 'image/png')).status).toBe(400);
  });

  it('computes the prices on the server: Paid with list + discount price', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({ ...(await validBody()), pricing: 'Paid', listPrice: '100', discountPrice: '80' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      pricing: 'Paid',
      listPrice: 100,
      discountPrice: 80,
      price: 80,
    });
  });

  it('never lets the discount price exceed the list price, nor go negative', async () => {
    const admin = await createUser('Admin');
    const high = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({ ...(await validBody()), pricing: 'Paid', listPrice: '50', discountPrice: '90' });
    expect(high.body.data).toMatchObject({ listPrice: 50, price: 50 });
    const negative = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({ ...(await validBody()), pricing: 'Paid', listPrice: '-5' });
    expect(negative.body.data.price).toBeGreaterThanOrEqual(0);
  });

  it('zeroes the prices of a Free course even when prices are sent', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .send({ ...(await validBody()), pricing: 'Free', price: '99' });
    expect(res.body.data).toMatchObject({ price: 0, listPrice: 0, discountPrice: 0 });
  });

  it('answers 400 when title, category or course type is missing', async () => {
    const admin = await createUser('Admin');
    const body = await validBody();
    for (const missing of ['title', 'category', 'courseType'] as const) {
      const partial: Record<string, string> = { ...body };
      delete partial[missing];
      const res = await request(app)
        .post('/api/courses')
        .set('Cookie', authCookie(admin))
        .send(partial);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Title, category, and course type are required');
    }
  });

  it('answers 400 (not 500) for malformed ids, bad JSON lists and bad enum values', async () => {
    const admin = await createUser('Admin');
    const body = await validBody();
    const post = (extra: Record<string, unknown>) =>
      request(app)
        .post('/api/courses')
        .set('Cookie', authCookie(admin))
        .send({ ...body, ...extra });
    expect((await post({ category: 'nope' })).status).toBe(400);
    expect((await post({ courseType: { $ne: null } })).status).toBe(400);
    expect((await post({ teachers: '{broken' })).status).toBe(400);
    expect((await post({ teachers: JSON.stringify(['nope']) })).status).toBe(400);
    expect((await post({ allowedSubscriptionPlans: 'broken' })).status).toBe(400);
    expect((await post({ visibility: 'Secret' })).status).toBe(400);
    expect((await post({ pricing: 'Gold' })).status).toBe(400);
  });

  it('answers 404 with a clear message for an unknown category or course type, 400 for unknown teachers', async () => {
    const admin = await createUser('Admin');
    const body = await validBody();
    const post = (extra: Record<string, unknown>) =>
      request(app)
        .post('/api/courses')
        .set('Cookie', authCookie(admin))
        .send({ ...body, ...extra });
    const category = await post({ category: missingId() });
    expect(category.status).toBe(404);
    expect(category.body.message).toBe('Category not found');
    const type = await post({ courseType: missingId() });
    expect(type.status).toBe(404);
    expect(type.body.message).toBe('Course type not found');
    const teachers = await post({ teachers: JSON.stringify([missingId()]) });
    expect(teachers.status).toBe(400);
    expect(await Course.countDocuments({ title: body.title })).toBe(0);
  });

  it('does not upload the cover image when the request is refused', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const body = await validBody();
    const res = await request(app)
      .post('/api/courses')
      .set('Cookie', authCookie(admin))
      .field('title', body.title)
      .field('category', missingId())
      .field('courseType', body.courseType)
      .attach('coverImage', PNG_BYTES, { filename: 'c.png', contentType: 'image/png' });
    expect(res.status).toBe(404);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', bearer(admin))
      .send(await validBody());
    expect(res.status).toBe(201);
  });

  it('answers 401 without a token', async () => {
    expect(
      (
        await request(app)
          .post('/api/courses')
          .send(await validBody())
      ).status,
    ).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and saves nothing', async (role) => {
    const user = await createUser(role);
    const body = await validBody();
    const res = await request(app).post('/api/courses').set('Cookie', authCookie(user)).send(body);
    expect(res.status).toBe(403);
    expect(await Course.countDocuments({ title: body.title })).toBe(0);
  });
});

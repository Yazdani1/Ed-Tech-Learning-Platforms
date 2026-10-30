import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { CourseType } from '../../src/models/CourseType.model';
import {
  authCookie,
  bearer,
  createCourseType,
  createCourse,
  createUser,
  missingId,
  nextId,
} from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';

describe('GET /api/course-types', () => {
  it('is public and returns every courseType sorted by name with a total', async () => {
    const tag = nextId();
    await createCourseType({ name: `Zeta ${tag}`, slug: `zeta-${tag}` });
    await createCourseType({ name: `Alpha ${tag}`, slug: `alpha-${tag}` });

    const res = await request(app).get('/api/course-types');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = (res.body.data as { name: string }[]).map((c) => c.name);
    expect(res.body.total).toBe(names.length);
    expect(names.indexOf(`Alpha ${tag}`)).toBeLessThan(names.indexOf(`Zeta ${tag}`));
  });
});

describe('POST /api/course-types', () => {
  it.each(ADMIN_ROLES)('lets %s create a courseType (slug built from the name)', async (role) => {
    const user = await createUser(role);
    const n = nextId();

    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(user))
      .send({ name: `Web Dev ${n}!`, description: 'All about the web' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Course type created' });
    expect(res.body.data).toMatchObject({
      name: `Web Dev ${n}!`,
      slug: `web-dev-${n}`,
      description: 'All about the web',
    });
    const saved = await CourseType.findById(res.body.data._id);
    expect(saved?.slug).toBe(`web-dev-${n}`);
  });

  it('accepts the Bearer header too', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/course-types')
      .set('Authorization', bearer(admin))
      .send({ name: `Bearer ${nextId()}` });
    expect(res.status).toBe(201);
  });

  it('answers 400 when the name is missing', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Course type name is required' });
  });

  it('answers 400 when the name has no letters or digits (empty slug)', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({ name: '!!!' });
    expect(res.status).toBe(400);
  });

  it('answers 400 (not 500) when the name is not a string', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({ name: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  it('answers 400 when another courseType already has the same slug', async () => {
    const admin = await createUser('Admin');
    const n = nextId();
    await createCourseType({ name: `Maths ${n}`, slug: `maths-${n}` });
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(admin))
      .send({ name: `MATHS ${n}` });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: 'A course type with this name already exists',
    });
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).post('/api/course-types').send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and saves nothing', async (role) => {
    const user = await createUser(role);
    const name = `Blocked ${role} ${nextId()}`;
    const res = await request(app)
      .post('/api/course-types')
      .set('Cookie', authCookie(user))
      .send({ name });
    expect(res.status).toBe(403);
    expect(await CourseType.countDocuments({ name })).toBe(0);
  });
});

describe('PUT /api/course-types/:id', () => {
  it.each(ADMIN_ROLES)('lets %s rename a courseType and refreshes the slug', async (role) => {
    const user = await createUser(role);
    const courseType = await createCourseType();
    const n = nextId();

    const res = await request(app)
      .put(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(user))
      .send({ name: `Renamed ${n}`, description: 'new text' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Course type updated');
    expect(res.body.data).toMatchObject({
      name: `Renamed ${n}`,
      slug: `renamed-${n}`,
      description: 'new text',
    });
    const saved = await CourseType.findById(courseType._id);
    expect(saved?.slug).toBe(`renamed-${n}`);
  });

  it('changes only the description when no name is sent', async () => {
    const admin = await createUser('Admin');
    const courseType = await createCourseType();
    const res = await request(app)
      .put(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(admin))
      .send({ description: 'only this' });
    expect(res.status).toBe(200);
    const saved = await CourseType.findById(courseType._id);
    expect(saved?.name).toBe(courseType.name);
    expect(saved?.slug).toBe(courseType.slug);
    expect(saved?.description).toBe('only this');
  });

  it('answers 400 when the new name collides with another courseType slug', async () => {
    const admin = await createUser('Admin');
    const other = await createCourseType();
    const courseType = await createCourseType();
    const res = await request(app)
      .put(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: other.name });
    expect(res.status).toBe(400);
  });

  it('answers 400 and keeps the old slug when the new name has no letters or digits', async () => {
    const admin = await createUser('Admin');
    const courseType = await createCourseType();
    const res = await request(app)
      .put(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: '!!!' });
    expect(res.status).toBe(400);
    const saved = await CourseType.findById(courseType._id);
    expect(saved?.slug).toBe(courseType.slug);
  });

  it('answers 404 for an unknown id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .put(`/api/course-types/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Course type not found');
  });

  it('answers 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .put('/api/course-types/not-an-id')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    expect(res.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const courseType = await createCourseType();
    const res = await request(app).put(`/api/course-types/${courseType._id}`).send({ name: 'x' });
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and changes nothing', async (role) => {
    const user = await createUser(role);
    const courseType = await createCourseType();
    const res = await request(app)
      .put(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(user))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
    expect((await CourseType.findById(courseType._id))?.name).toBe(courseType.name);
  });
});

describe('DELETE /api/course-types/:id', () => {
  it.each(ADMIN_ROLES)('lets %s delete an unused courseType', async (role) => {
    const user = await createUser(role);
    const courseType = await createCourseType();
    const res = await request(app)
      .delete(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Course type deleted' });
    expect(await CourseType.findById(courseType._id)).toBeNull();
  });

  it('refuses to delete a courseType that courses still use (courses would lose their courseType)', async () => {
    const admin = await createUser('Admin');
    const courseType = await createCourseType();
    await createCourse({ courseType: courseType._id });
    const res = await request(app)
      .delete(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Course type is used by 1 course(s)');
    expect(await CourseType.findById(courseType._id)).not.toBeNull();
  });

  it('answers 404 for an unknown id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .delete(`/api/course-types/${missingId()}`)
      .set('Cookie', authCookie(admin));
    expect(missing.status).toBe(404);
    const bad = await request(app)
      .delete('/api/course-types/nope')
      .set('Cookie', authCookie(admin));
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const courseType = await createCourseType();
    const res = await request(app).delete(`/api/course-types/${courseType._id}`);
    expect(res.status).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s and keeps the courseType', async (role) => {
    const user = await createUser(role);
    const courseType = await createCourseType();
    const res = await request(app)
      .delete(`/api/course-types/${courseType._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
    expect(await CourseType.findById(courseType._id)).not.toBeNull();
  });
});

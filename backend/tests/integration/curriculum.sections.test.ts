import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { Lecture } from '../../src/models/Lecture.model';
import { Section } from '../../src/models/Section.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES, createLecture, createSection } from '../factories/catalog';

describe('POST /api/courses/:courseId/sections', () => {
  it.each(ADMIN_ROLES)('lets %s add sections; order follows the position', async (role) => {
    const admin = await createUser(role);
    const course = await createCourse();

    const first = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Intro' });
    const second = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Basics' });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ success: true, message: 'Section added' });
    expect(first.body.data).toMatchObject({ title: 'Intro', order: 0, course: String(course._id) });
    expect(second.body.data.order).toBe(1);
    const saved = await Course.findById(course._id);
    expect(saved?.sections.map(String)).toEqual([first.body.data._id, second.body.data._id]);
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Authorization', bearer(admin))
      .send({ title: 'Bearer' });
    expect(res.status).toBe(201);
  });

  it('answers 400 without a title and saves nothing', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Cookie', authCookie(admin))
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Section title is required');
    expect(await Section.countDocuments({ course: course._id })).toBe(0);
  });

  it('answers 400 (not 500) when the title is not a string', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Cookie', authCookie(admin))
      .send({ title: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  it('answers 404 for an unknown course and 400 for a malformed course id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .post(`/api/courses/${missingId()}/sections`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Course not found');
    const bad = await request(app)
      .post('/api/courses/nope/sections')
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token', async () => {
    const course = await createCourse();
    expect(
      (await request(app).post(`/api/courses/${course._id}/sections`).send({ title: 'x' })).status,
    ).toBe(401);
  });

  it.each(NON_ADMIN_ROLES)('answers 403 for %s', async (role) => {
    const user = await createUser(role);
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/sections`)
      .set('Cookie', authCookie(user))
      .send({ title: 'x' });
    expect(res.status).toBe(403);
    expect(await Section.countDocuments({ course: course._id })).toBe(0);
  });
});

describe('PUT /api/courses/:courseId/sections/:sectionId', () => {
  it.each(ADMIN_ROLES)('lets %s rename a section', async (role) => {
    const admin = await createUser(role);
    const course = await createCourse();
    const section = await createSection(course);
    const res = await request(app)
      .put(`/api/courses/${course._id}/sections/${section._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'Section updated', data: { title: 'Renamed' } });
    expect((await Section.findById(section._id))?.title).toBe('Renamed');
  });

  it('keeps the title when none is sent', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const section = await createSection(course);
    const res = await request(app)
      .put(`/api/courses/${course._id}/sections/${section._id}`)
      .set('Cookie', authCookie(admin))
      .send({});
    expect(res.status).toBe(200);
    expect((await Section.findById(section._id))?.title).toBe(section.title);
  });

  it('answers 404 when the section belongs to another course (no cross-course edit)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const other = await createCourse();
    const section = await createSection(other);
    const res = await request(app)
      .put(`/api/courses/${course._id}/sections/${section._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Hijacked' });
    expect(res.status).toBe(404);
    expect((await Section.findById(section._id))?.title).toBe(section.title);
  });

  it('answers 404 for an unknown section and 400 for malformed ids', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const missing = await request(app)
      .put(`/api/courses/${course._id}/sections/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Section not found');
    const bad = await request(app)
      .put(`/api/courses/${course._id}/sections/nope`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const course = await createCourse();
    const section = await createSection(course);
    const url = `/api/courses/${course._id}/sections/${section._id}`;
    expect((await request(app).put(url).send({ title: 'x' })).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await request(app).put(url).set('Cookie', authCookie(user)).send({ title: 'x' });
      expect(res.status, role).toBe(403);
    }
    expect((await Section.findById(section._id))?.title).toBe(section.title);
  });
});

describe('DELETE /api/courses/:courseId/sections/:sectionId', () => {
  it.each(ADMIN_ROLES)(
    'lets %s delete a section with its lectures and unlinks it',
    async (role) => {
      const admin = await createUser(role);
      const course = await createCourse();
      const keep = await createSection(course);
      const section = await createSection(course);
      const lecture = await createLecture(section);

      const res = await request(app)
        .delete(`/api/courses/${course._id}/sections/${section._id}`)
        .set('Cookie', authCookie(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Section deleted' });
      expect(await Section.findById(section._id)).toBeNull();
      expect(await Lecture.findById(lecture._id)).toBeNull();
      const saved = await Course.findById(course._id);
      expect(saved?.sections.map(String)).toEqual([String(keep._id)]);
    },
  );

  it('answers 404 for a section of another course and keeps it', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const other = await createCourse();
    const section = await createSection(other);
    const res = await request(app)
      .delete(`/api/courses/${course._id}/sections/${section._id}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(404);
    expect(await Section.findById(section._id)).not.toBeNull();
  });

  it('answers 404 for an unknown section and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    expect(
      (
        await request(app)
          .delete(`/api/courses/${course._id}/sections/${missingId()}`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .delete(`/api/courses/${course._id}/sections/nope`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(400);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const course = await createCourse();
    const section = await createSection(course);
    const url = `/api/courses/${course._id}/sections/${section._id}`;
    expect((await request(app).delete(url)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      expect((await request(app).delete(url).set('Cookie', authCookie(user))).status, role).toBe(
        403,
      );
    }
    expect(await Section.findById(section._id)).not.toBeNull();
  });
});

describe('PUT /api/courses/:courseId/sections/reorder', () => {
  const reorder = (user: Awaited<ReturnType<typeof createUser>>, courseId: string, body: unknown) =>
    request(app)
      .put(`/api/courses/${courseId}/sections/reorder`)
      .set('Cookie', authCookie(user))
      .send(body as object);

  it.each(ADMIN_ROLES)(
    'lets %s reorder the sections (order field and course list)',
    async (role) => {
      const admin = await createUser(role);
      const course = await createCourse();
      const a = await createSection(course);
      const b = await createSection(course);
      const c = await createSection(course);

      const res = await reorder(admin, String(course._id), {
        orderedIds: [String(c._id), String(a._id), String(b._id)],
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Sections reordered' });
      expect((await Section.findById(c._id))?.order).toBe(0);
      expect((await Section.findById(a._id))?.order).toBe(1);
      expect((await Section.findById(b._id))?.order).toBe(2);
      const saved = await Course.findById(course._id);
      expect(saved?.sections.map(String)).toEqual([String(c._id), String(a._id), String(b._id)]);
    },
  );

  it('answers 400 when orderedIds is missing or not an array', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    for (const body of [{}, { orderedIds: 'abc' }, { orderedIds: { $ne: 1 } }]) {
      const res = await reorder(admin, String(course._id), body);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('orderedIds array is required');
    }
  });

  it('answers 400 for malformed ids inside orderedIds', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    await createSection(course);
    const res = await reorder(admin, String(course._id), { orderedIds: ['nope'] });
    expect(res.status).toBe(400);
  });

  it('answers 404 for an unknown course', async () => {
    const admin = await createUser('Admin');
    const res = await reorder(admin, missingId(), { orderedIds: [] });
    expect(res.status).toBe(404);
  });

  it('refuses ids that are not sections of this course (no cross-course changes)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const mine = await createSection(course);
    const other = await createCourse();
    const foreign = await createSection(other, { order: 7 });

    const res = await reorder(admin, String(course._id), {
      orderedIds: [String(foreign._id), String(mine._id)],
    });

    expect(res.status).toBe(400);
    expect((await Section.findById(foreign._id))?.order).toBe(7);
    expect((await Course.findById(course._id))?.sections.map(String)).toEqual([String(mine._id)]);
  });

  it('refuses a list that leaves out a section or repeats one (no section is dropped)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const a = await createSection(course);
    const b = await createSection(course);
    for (const orderedIds of [[String(a._id)], [String(a._id), String(a._id)]]) {
      const res = await reorder(admin, String(course._id), { orderedIds });
      expect(res.status).toBe(400);
    }
    expect((await Course.findById(course._id))?.sections.map(String)).toEqual([
      String(a._id),
      String(b._id),
    ]);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const course = await createCourse();
    const a = await createSection(course);
    const url = `/api/courses/${course._id}/sections/reorder`;
    expect(
      (
        await request(app)
          .put(url)
          .send({ orderedIds: [String(a._id)] })
      ).status,
    ).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await reorder(user, String(course._id), { orderedIds: [String(a._id)] });
      expect(res.status, role).toBe(403);
    }
  });
});

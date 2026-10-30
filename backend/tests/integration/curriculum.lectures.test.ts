import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Lecture } from '../../src/models/Lecture.model';
import { Section } from '../../src/models/Section.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES, createLecture, createSection } from '../factories/catalog';

const setup = async () => {
  const course = await createCourse();
  const section = await createSection(course);
  return { course, section, base: `/api/courses/${course._id}/sections/${section._id}/lectures` };
};

describe('POST /api/courses/:courseId/sections/:sectionId/lectures', () => {
  it.each(ADMIN_ROLES)('lets %s add lectures; order follows the position', async (role) => {
    const admin = await createUser(role);
    const { section, base } = await setup();

    const first = await request(app).post(base).set('Cookie', authCookie(admin)).send({
      title: 'Welcome',
      description: 'Say hi',
      videoUrl: 'https://youtu.be/abc',
      isPreview: true,
      duration: 120,
    });
    const second = await request(app)
      .post(base)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Next' });

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ success: true, message: 'Lecture added' });
    expect(first.body.data).toMatchObject({
      title: 'Welcome',
      description: 'Say hi',
      videoUrl: 'https://youtu.be/abc',
      isPreview: true,
      duration: 120,
      order: 0,
      section: String(section._id),
    });
    expect(second.body.data).toMatchObject({ order: 1, isPreview: false });
    const saved = await Section.findById(section._id);
    expect(saved?.lectures.map(String)).toEqual([first.body.data._id, second.body.data._id]);
  });

  it('accepts the Bearer header', async () => {
    const admin = await createUser('Admin');
    const { base } = await setup();
    const res = await request(app)
      .post(base)
      .set('Authorization', bearer(admin))
      .send({ title: 'B' });
    expect(res.status).toBe(201);
  });

  it('answers 400 without a title, with a negative duration or a non-string title', async () => {
    const admin = await createUser('Admin');
    const { section, base } = await setup();
    const none = await request(app).post(base).set('Cookie', authCookie(admin)).send({});
    expect(none.status).toBe(400);
    expect(none.body.message).toBe('Lecture title is required');
    const negative = await request(app)
      .post(base)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x', duration: -3 });
    expect(negative.status).toBe(400);
    const object = await request(app)
      .post(base)
      .set('Cookie', authCookie(admin))
      .send({ title: { $ne: 'x' } });
    expect(object.status).toBe(400);
    expect(await Lecture.countDocuments({ section: section._id })).toBe(0);
  });

  it('answers 404 for an unknown section, a section of another course, and 400 for malformed ids', async () => {
    const admin = await createUser('Admin');
    const { course, section } = await setup();
    const other = await createCourse();
    const post = (courseId: string, sectionId: string) =>
      request(app)
        .post(`/api/courses/${courseId}/sections/${sectionId}/lectures`)
        .set('Cookie', authCookie(admin))
        .send({ title: 'x' });
    expect((await post(String(course._id), missingId())).status).toBe(404);
    const wrongCourse = await post(String(other._id), String(section._id));
    expect(wrongCourse.status).toBe(404);
    expect(wrongCourse.body.message).toBe('Section not found');
    expect((await post(String(course._id), 'nope')).status).toBe(400);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const { section, base } = await setup();
    expect((await request(app).post(base).send({ title: 'x' })).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await request(app)
        .post(base)
        .set('Cookie', authCookie(user))
        .send({ title: 'x' });
      expect(res.status, role).toBe(403);
    }
    expect(await Lecture.countDocuments({ section: section._id })).toBe(0);
  });
});

describe('PUT /api/courses/:courseId/sections/:sectionId/lectures/:lectureId', () => {
  it.each(ADMIN_ROLES)('lets %s update the lecture fields', async (role) => {
    const admin = await createUser(role);
    const { section, base } = await setup();
    const lecture = await createLecture(section);

    const res = await request(app)
      .put(`${base}/${lecture._id}`)
      .set('Cookie', authCookie(admin))
      .send({
        title: 'New',
        description: 'D',
        videoUrl: 'https://v/1',
        isPreview: true,
        duration: 90,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Lecture updated');
    expect(await Lecture.findById(lecture._id)).toMatchObject({
      title: 'New',
      description: 'D',
      videoUrl: 'https://v/1',
      isPreview: true,
      duration: 90,
    });
  });

  it('keeps fields that are not sent, and can set a falsy value (isPreview false, duration 0)', async () => {
    const admin = await createUser('Admin');
    const { section, base } = await setup();
    const lecture = await createLecture(section, { isPreview: true, duration: 50 });
    const res = await request(app)
      .put(`${base}/${lecture._id}`)
      .set('Cookie', authCookie(admin))
      .send({ isPreview: false, duration: 0 });
    expect(res.status).toBe(200);
    const saved = await Lecture.findById(lecture._id);
    expect(saved).toMatchObject({ title: lecture.title, isPreview: false, duration: 0 });
  });

  it('answers 400 for an empty title or a negative duration', async () => {
    const admin = await createUser('Admin');
    const { section, base } = await setup();
    const lecture = await createLecture(section);
    for (const body of [{ title: '' }, { duration: -1 }]) {
      const res = await request(app)
        .put(`${base}/${lecture._id}`)
        .set('Cookie', authCookie(admin))
        .send(body);
      expect(res.status).toBe(400);
    }
    expect((await Lecture.findById(lecture._id))?.title).toBe(lecture.title);
  });

  it('answers 404 for a lecture of another section and for an unknown lecture; 400 for malformed ids', async () => {
    const admin = await createUser('Admin');
    const { course, base } = await setup();
    const otherSection = await createSection(course);
    const foreign = await createLecture(otherSection);
    const hijack = await request(app)
      .put(`${base}/${foreign._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'Hijacked' });
    expect(hijack.status).toBe(404);
    expect((await Lecture.findById(foreign._id))?.title).toBe(foreign.title);
    const missing = await request(app)
      .put(`${base}/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('Lecture not found');
    const bad = await request(app)
      .put(`${base}/nope`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'x' });
    expect(bad.status).toBe(400);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const { section, base } = await setup();
    const lecture = await createLecture(section);
    expect((await request(app).put(`${base}/${lecture._id}`).send({ title: 'x' })).status).toBe(
      401,
    );
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await request(app)
        .put(`${base}/${lecture._id}`)
        .set('Cookie', authCookie(user))
        .send({ title: 'x' });
      expect(res.status, role).toBe(403);
    }
    expect((await Lecture.findById(lecture._id))?.title).toBe(lecture.title);
  });
});

describe('DELETE /api/courses/:courseId/sections/:sectionId/lectures/:lectureId', () => {
  it.each(ADMIN_ROLES)('lets %s delete a lecture and unlinks it from the section', async (role) => {
    const admin = await createUser(role);
    const { section, base } = await setup();
    const keep = await createLecture(section);
    const lecture = await createLecture(section);

    const res = await request(app)
      .delete(`${base}/${lecture._id}`)
      .set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Lecture deleted' });
    expect(await Lecture.findById(lecture._id)).toBeNull();
    expect((await Section.findById(section._id))?.lectures.map(String)).toEqual([String(keep._id)]);
  });

  it('answers 404 for a lecture of another section and an unknown lecture; 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const { course, base } = await setup();
    const foreign = await createLecture(await createSection(course));
    const cross = await request(app)
      .delete(`${base}/${foreign._id}`)
      .set('Cookie', authCookie(admin));
    expect(cross.status).toBe(404);
    expect(await Lecture.findById(foreign._id)).not.toBeNull();
    expect(
      (await request(app).delete(`${base}/${missingId()}`).set('Cookie', authCookie(admin))).status,
    ).toBe(404);
    expect(
      (await request(app).delete(`${base}/nope`).set('Cookie', authCookie(admin))).status,
    ).toBe(400);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const { section, base } = await setup();
    const lecture = await createLecture(section);
    expect((await request(app).delete(`${base}/${lecture._id}`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await request(app)
        .delete(`${base}/${lecture._id}`)
        .set('Cookie', authCookie(user));
      expect(res.status, role).toBe(403);
    }
    expect(await Lecture.findById(lecture._id)).not.toBeNull();
  });
});

describe('PUT /api/courses/:courseId/sections/:sectionId/lectures/reorder', () => {
  it.each(ADMIN_ROLES)(
    'lets %s reorder the lectures (order field and section list)',
    async (role) => {
      const admin = await createUser(role);
      const { section, base } = await setup();
      const a = await createLecture(section);
      const b = await createLecture(section);
      const c = await createLecture(section);

      const res = await request(app)
        .put(`${base}/reorder`)
        .set('Cookie', authCookie(admin))
        .send({ orderedIds: [String(b._id), String(c._id), String(a._id)] });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Lectures reordered' });
      expect((await Lecture.findById(b._id))?.order).toBe(0);
      expect((await Lecture.findById(c._id))?.order).toBe(1);
      expect((await Lecture.findById(a._id))?.order).toBe(2);
      expect((await Section.findById(section._id))?.lectures.map(String)).toEqual([
        String(b._id),
        String(c._id),
        String(a._id),
      ]);
    },
  );

  it('answers 400 when orderedIds is missing or not an array, and for malformed ids', async () => {
    const admin = await createUser('Admin');
    const { base } = await setup();
    for (const body of [{}, { orderedIds: 'abc' }]) {
      const res = await request(app)
        .put(`${base}/reorder`)
        .set('Cookie', authCookie(admin))
        .send(body);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('orderedIds array is required');
    }
    const bad = await request(app)
      .put(`${base}/reorder`)
      .set('Cookie', authCookie(admin))
      .send({ orderedIds: ['nope'] });
    expect(bad.status).toBe(400);
  });

  it('answers 404 for an unknown section', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .put(`/api/courses/${course._id}/sections/${missingId()}/lectures/reorder`)
      .set('Cookie', authCookie(admin))
      .send({ orderedIds: [] });
    expect(res.status).toBe(404);
  });

  it('refuses ids that are not lectures of this section (no cross-section changes)', async () => {
    const admin = await createUser('Admin');
    const { course, section, base } = await setup();
    const mine = await createLecture(section);
    const foreign = await createLecture(await createSection(course), { order: 9 });
    const res = await request(app)
      .put(`${base}/reorder`)
      .set('Cookie', authCookie(admin))
      .send({ orderedIds: [String(foreign._id), String(mine._id)] });
    expect(res.status).toBe(400);
    expect((await Lecture.findById(foreign._id))?.order).toBe(9);
    expect((await Section.findById(section._id))?.lectures.map(String)).toEqual([String(mine._id)]);
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const { section, base } = await setup();
    const a = await createLecture(section);
    expect(
      (
        await request(app)
          .put(`${base}/reorder`)
          .send({ orderedIds: [String(a._id)] })
      ).status,
    ).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      const res = await request(app)
        .put(`${base}/reorder`)
        .set('Cookie', authCookie(user))
        .send({ orderedIds: [String(a._id)] });
      expect(res.status, role).toBe(403);
    }
  });
});

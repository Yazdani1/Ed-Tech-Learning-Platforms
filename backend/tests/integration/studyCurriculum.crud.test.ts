import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { StudyCurriculum } from '../../src/models/StudyCurriculum.model';
import { authCookie, bearer, createCourse, createUser, enrol, missingId } from '../factories';
import { createCurriculum, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
const lecture = { title: ' Intro ', description: ' Hi ', day: ' Monday ', time: ' 10:00 ' };
const body = {
  title: ' Week one ',
  description: ' Live ',
  weekName: ' Week 1 ',
  lectures: [lecture],
};

describe('GET /api/study-curricula/course/:courseId', () => {
  it('lists the curricula oldest first with the poster, for an enrolled student', async () => {
    const { user, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const first = await createCurriculum(course, user);
    await createCurriculum(await createCourse(), user);
    const second = await createCurriculum(course, user);
    const res = await request(app)
      .get(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([
      String(first._id),
      String(second._id),
    ]);
    expect(res.body.data[0].lectures[0]).toMatchObject({
      title: 'Intro',
      day: 'Monday',
      time: '10:00',
    });
    expect(res.body.data[0].postedBy.email).toBeUndefined();
  });

  it('works with the Bearer header for the assigned teacher', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .get(`/api/study-curricula/course/${course._id}`)
      .set('Authorization', bearer(user));
    expect(res.status).toBe(200);
  });

  // Decision (Phase 7): the schedule is public (the course page shows it), but only the public fields.
  const PUBLIC_KEYS = [
    '_id',
    'course',
    'createdAt',
    'description',
    'lectures',
    'title',
    'updatedAt',
    'weekName',
  ];
  const LECTURE_KEYS = ['_id', 'day', 'description', 'time', 'title'];

  it('a guest gets the schedule with the public fields only (no poster, no links)', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createCurriculum(course, user);
    const res = await request(app).get(`/api/study-curricula/course/${course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(Object.keys(res.body.data[0]).sort()).toEqual(PUBLIC_KEYS);
    expect(Object.keys(res.body.data[0].lectures[0]).sort()).toEqual(LECTURE_KEYS);
    expect(res.body.data[0].lectures[0]).toMatchObject({ title: 'Intro', day: 'Monday' });
  });

  it.each<UserRole>(['Student', 'Teacher'])(
    'a %s without access gets the public fields only',
    async (role) => {
      const { user, course } = await createTeacherWithCourse();
      await createCurriculum(course, user);
      const res = await request(app)
        .get(`/api/study-curricula/course/${course._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(200);
      expect(Object.keys(res.body.data[0]).sort()).toEqual(PUBLIC_KEYS);
      expect(res.body.data[0].postedBy).toBeUndefined();
    },
  );

  it.each(ADMINS)('%s gets the full list with the poster', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    await createCurriculum(course, user);
    const res = await request(app)
      .get(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(await createUser(role)));
    expect(res.status).toBe(200);
    expect(res.body.data[0].postedBy.name).toBe(user.name);
  });

  it('404 for an unknown course (also for a guest)', async () => {
    const res = await request(app).get(`/api/study-curricula/course/${missingId()}`);
    expect(res.status).toBe(404);
  });

  it('400 for a malformed course id', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .get('/api/study-curricula/course/not-an-id')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/study-curricula/course/:courseId', () => {
  it.each<UserRole>(['Super Admin', 'Admin'])(
    '%s creates; text is trimmed and stored',
    async (role) => {
      const poster = await createUser(role);
      const course = await createCourse();
      const res = await request(app)
        .post(`/api/study-curricula/course/${course._id}`)
        .set('Cookie', authCookie(poster))
        .send(body);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Live class added');
      expect(res.body.data).toMatchObject({
        title: 'Week one',
        description: 'Live',
        weekName: 'Week 1',
      });
      expect(res.body.data.lectures[0]).toMatchObject({
        title: 'Intro',
        description: 'Hi',
        day: 'Monday',
        time: '10:00',
      });
      const saved = await StudyCurriculum.findOne({ course: course._id });
      expect(String(saved?.postedBy)).toBe(String(poster._id));
    },
  );

  it('the assigned teacher creates; lectures default to an empty list', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(user))
      .send({ title: 'T', description: 'D', weekName: 'W' });
    expect(res.status).toBe(201);
    expect(res.body.data.lectures).toEqual([]);
  });

  it('403 for a teacher of another course, nothing saved', async () => {
    const { user } = await createTeacherWithCourse();
    const foreign = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${foreign.course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(403);
    expect(await StudyCurriculum.countDocuments({ course: foreign.course._id })).toBe(0);
  });

  it('403 for a teacher without a profile', async () => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(await createUser('Teacher')))
      .send(body);
    expect(res.status).toBe(403);
  });

  it.each<UserRole>(['Moderator', 'Student'])(
    '403 for %s (route is not open to them)',
    async (role) => {
      const course = await createCourse();
      const res = await request(app)
        .post(`/api/study-curricula/course/${course._id}`)
        .set('Cookie', authCookie(await createUser(role)))
        .send(body);
      expect(res.status).toBe(403);
    },
  );

  it.each([
    ['blank title', { ...body, title: ' ' }],
    ['missing description', { title: 'x', weekName: 'w' }],
    ['missing week name', { title: 'x', description: 'd' }],
    ['lecture without title', { ...body, lectures: [{ day: 'Mon', time: '1' }] }],
    ['lecture without day', { ...body, lectures: [{ title: 'a', time: '1' }] }],
    ['lecture without time', { ...body, lectures: [{ title: 'a', day: 'Mon' }] }],
  ])('400 for %s', async (_n, payload) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send(payload);
    expect(res.status).toBe(400);
    expect(await StudyCurriculum.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 (not 500) when lectures is not a list', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ ...body, lectures: 'nope' });
    expect(res.status).toBe(400);
  });

  it.each([
    ['title is an object', { ...body, title: { $ne: 1 } }],
    ['week name is a number', { ...body, weekName: 5 }],
    ['a lecture is null', { ...body, lectures: [null] }],
    ['a lecture title is an array', { ...body, lectures: [{ ...lecture, title: ['a'] }] }],
    ['a lecture description is a number', { ...body, lectures: [{ ...lecture, description: 1 }] }],
  ])('400 (not 500) when %s', async (_n, payload) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-curricula/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send(payload);
    expect(res.status).toBe(400);
    expect(await StudyCurriculum.countDocuments({ course: course._id })).toBe(0);
  });

  it('PUT also answers 400 when lectures is not a list', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const res = await request(app)
      .put(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(user))
      .send({ ...body, lectures: { title: 'x' } });
    expect(res.status).toBe(400);
  });

  it('404 missing course, 400 malformed id, 401 no token', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .post(`/api/study-curricula/course/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/study-curricula/course/not-an-id')
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(400);
    expect(
      (await request(app).post(`/api/study-curricula/course/${missingId()}`).send(body)).status,
    ).toBe(401);
  });
});

describe('PUT /api/study-curricula/:id', () => {
  it('the owner replaces the fields and the lectures', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const res = await request(app)
      .put(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(user))
      .send({ ...body, lectures: [] });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Live class updated');
    const saved = await StudyCurriculum.findById(item._id);
    expect(saved?.title).toBe('Week one');
    expect(saved?.lectures).toHaveLength(0);
  });

  it.each(ADMINS)('%s updates anyone live class', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const res = await request(app)
      .put(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send(body);
    expect(res.status).toBe(200);
  });

  it('403 for another teacher and a student; unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .put(`/api/study-curricula/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)))
        .send(body);
      expect(res.status).toBe(403);
    }
    expect((await StudyCurriculum.findById(item._id))?.title).toBe(item.title);
  });

  it('400 for invalid fields, 404 missing, 400 malformed, 401 no token', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .put(`/api/study-curricula/${item._id}`)
          .set('Cookie', authCookie(user))
          .send({ ...body, title: '' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/study-curricula/${item._id}`)
          .set('Cookie', authCookie(user))
          .send({ ...body, lectures: [{ title: 'a' }] })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/study-curricula/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/study-curricula/not-an-id')
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(400);
    expect((await request(app).put(`/api/study-curricula/${item._id}`).send(body)).status).toBe(
      401,
    );
  });
});

describe('DELETE /api/study-curricula/:id', () => {
  it('the owner deletes it', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const res = await request(app)
      .delete(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Live class deleted' });
    expect(await StudyCurriculum.findById(item._id)).toBeNull();
  });

  it.each(ADMINS)('%s deletes anyone live class', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    const res = await request(app)
      .delete(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(await createUser(role)));
    expect(res.status).toBe(200);
  });

  it('403 for another teacher and a student; kept', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .delete(`/api/study-curricula/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(403);
    }
    expect(await StudyCurriculum.findById(item._id)).not.toBeNull();
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .delete(`/api/study-curricula/${missingId()}`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/study-curricula/not-an-id').set('Cookie', authCookie(admin)))
        .status,
    ).toBe(400);
    expect((await request(app).delete(`/api/study-curricula/${missingId()}`)).status).toBe(401);
  });
});

describe('PUT/DELETE /api/study-curricula/:id by an author no longer teaching the course', () => {
  it('SECURITY: 403 on update and delete once the teacher is removed from the course; item unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createCurriculum(course, user);
    await Course.updateOne({ _id: course._id }, { $set: { teachers: [] } });
    const put = await request(app)
      .put(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(put.status).toBe(403);
    expect(put.body.message).toBe('You are no longer a teacher of this course');
    const del = await request(app)
      .delete(`/api/study-curricula/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(del.status).toBe(403);
    const saved = await StudyCurriculum.findById(item._id);
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe(item.title);
  });
});

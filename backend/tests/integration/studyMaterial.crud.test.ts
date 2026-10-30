import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { StudyMaterial } from '../../src/models/StudyMaterial.model';
import { authCookie, bearer, createCourse, createUser, enrol, missingId } from '../factories';
import { createMaterial, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
const body = {
  title: '  Chapter 1  ',
  description: '  Read it  ',
  fileUrl: '  https://example.com/a.pdf ',
};

describe('GET /api/study-materials/course/:courseId', () => {
  it('lists the materials newest first for an enrolled student', async () => {
    const { user, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const first = await createMaterial(course, user);
    await createMaterial(await createCourse(), user);
    const second = await createMaterial(course, user);
    const res = await request(app)
      .get(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((m: { _id: string }) => m._id)).toEqual([
      String(second._id),
      String(first._id),
    ]);
    expect(res.body.data[0].postedBy.name).toBe(user.name);
    expect(res.body.data[0].postedBy.email).toBeUndefined();
  });

  it('the assigned teacher and admins can read; Bearer header works', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createMaterial(course, user);
    const teacherRes = await request(app)
      .get(`/api/study-materials/course/${course._id}`)
      .set('Authorization', bearer(user));
    expect(teacherRes.body.total).toBe(1);
    const adminRes = await request(app)
      .get(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(await createUser('Admin')));
    expect(adminRes.body.total).toBe(1);
  });

  it('403 for a student who is not enrolled (course content)', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createMaterial(course, user);
    const res = await request(app)
      .get(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(await createUser('Student')));
    expect(res.status).toBe(403);
  });

  it('403 for a teacher who is not assigned to the course', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createMaterial(course, user);
    const other = await createTeacherWithCourse();
    const res = await request(app)
      .get(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(other.user));
    expect(res.status).toBe(403);
  });

  it('400 for a malformed course id, 401 without token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .get('/api/study-materials/course/not-an-id')
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(400);
    expect((await request(app).get(`/api/study-materials/course/${missingId()}`)).status).toBe(401);
  });

  it('404 for an unknown course', async () => {
    const res = await request(app)
      .get(`/api/study-materials/course/${missingId()}`)
      .set('Cookie', authCookie(await createUser('Admin')));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/study-materials/course/:courseId', () => {
  it.each(ADMINS)('%s creates a material; fields trimmed', async (role) => {
    const poster = await createUser(role);
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(poster))
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Study material added');
    expect(res.body.data).toMatchObject({
      title: 'Chapter 1',
      description: 'Read it',
      fileUrl: 'https://example.com/a.pdf',
    });
    expect(String((await StudyMaterial.findOne({ course: course._id }))?.postedBy)).toBe(
      String(poster._id),
    );
  });

  it('fileUrl is optional', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(user))
      .send({ title: 'T', description: 'D' });
    expect(res.status).toBe(201);
    expect(res.body.data.fileUrl).toBeUndefined();
  });

  it('rejects a javascript: file URL', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'T', description: 'D', fileUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it.each(['data:text/html,<b>x</b>', 'ftp://example.com/a.pdf', 'not a url', '//example.com/a'])(
    'rejects the non-http(s) file URL %j; nothing saved',
    async (fileUrl) => {
      const admin = await createUser('Admin');
      const course = await createCourse();
      const res = await request(app)
        .post(`/api/study-materials/course/${course._id}`)
        .set('Cookie', authCookie(admin))
        .send({ title: 'T', description: 'D', fileUrl });
      expect(res.status).toBe(400);
      expect(await StudyMaterial.countDocuments({ course: course._id })).toBe(0);
    },
  );

  it('accepts an http:// file URL', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'T', description: 'D', fileUrl: 'http://example.com/a.pdf' });
    expect(res.status).toBe(201);
    expect(res.body.data.fileUrl).toBe('http://example.com/a.pdf');
  });

  it('403 for a teacher of another course, nothing saved', async () => {
    const { user } = await createTeacherWithCourse();
    const foreign = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${foreign.course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(403);
    expect(await StudyMaterial.countDocuments({ course: foreign.course._id })).toBe(0);
  });

  it('403 for a student, even an enrolled one', async () => {
    const student = await createUser('Student');
    const course = await createCourse();
    await enrol(student, course);
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(student))
      .send(body);
    expect(res.status).toBe(403);
  });

  it.each([
    ['blank title', { title: ' ', description: 'x' }],
    ['missing description', { title: 'x' }],
  ])('400 for %s', async (_n, payload) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when fileUrl is an object', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/study-materials/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: 'T', description: 'D', fileUrl: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('404 missing course, 400 malformed id, 401 no token', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .post(`/api/study-materials/course/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/study-materials/course/not-an-id')
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(400);
    expect(
      (await request(app).post(`/api/study-materials/course/${missingId()}`).send(body)).status,
    ).toBe(401);
  });
});

describe('PUT /api/study-materials/:id', () => {
  it('the owner updates it; empty fileUrl clears it', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const res = await request(app)
      .put(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(user))
      .send({ title: ' New ', description: ' Desc ', fileUrl: '' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Study material updated');
    const saved = await StudyMaterial.findById(item._id);
    expect(saved?.title).toBe('New');
    expect(saved?.fileUrl).toBeUndefined();
  });

  it.each([
    ['a javascript: file URL', { ...body, fileUrl: 'javascript:alert(1)' }],
    ['a file URL that is an object', { ...body, fileUrl: { a: 1 } }],
    ['a title that is an object', { ...body, title: { $ne: 1 } }],
  ])('400 for %s; unchanged', async (_n, payload) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const res = await request(app)
      .put(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(user))
      .send(payload);
    expect(res.status).toBe(400);
    const saved = await StudyMaterial.findById(item._id);
    expect(saved?.fileUrl).toBe(item.fileUrl);
    expect(saved?.title).toBe(item.title);
  });

  it.each(ADMINS)('%s updates anyone material', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const res = await request(app)
      .put(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send(body);
    expect(res.status).toBe(200);
  });

  it('403 for another teacher and a student; unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .put(`/api/study-materials/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)))
        .send(body);
      expect(res.status).toBe(403);
    }
    expect((await StudyMaterial.findById(item._id))?.title).toBe(item.title);
  });

  it('400 blank title, 404 missing, 400 malformed, 401 no token', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .put(`/api/study-materials/${item._id}`)
          .set('Cookie', authCookie(user))
          .send({ title: '', description: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/study-materials/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/study-materials/not-an-id')
          .set('Cookie', authCookie(admin))
          .send(body)
      ).status,
    ).toBe(400);
    expect((await request(app).put(`/api/study-materials/${item._id}`).send(body)).status).toBe(
      401,
    );
  });
});

describe('DELETE /api/study-materials/:id', () => {
  it('the owner deletes it', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const res = await request(app)
      .delete(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Study material deleted' });
    expect(await StudyMaterial.findById(item._id)).toBeNull();
  });

  it.each(ADMINS)('%s deletes anyone material', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    const res = await request(app)
      .delete(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(await createUser(role)));
    expect(res.status).toBe(200);
  });

  it('403 for another teacher and a student; kept', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .delete(`/api/study-materials/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(403);
    }
    expect(await StudyMaterial.findById(item._id)).not.toBeNull();
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .delete(`/api/study-materials/${missingId()}`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/study-materials/not-an-id').set('Cookie', authCookie(admin)))
        .status,
    ).toBe(400);
    expect((await request(app).delete(`/api/study-materials/${missingId()}`)).status).toBe(401);
  });
});

describe('PUT/DELETE /api/study-materials/:id by an author no longer teaching the course', () => {
  it('SECURITY: 403 on update and delete once the teacher is removed from the course; item unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createMaterial(course, user);
    await Course.updateOne({ _id: course._id }, { $set: { teachers: [] } });
    const put = await request(app)
      .put(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(put.status).toBe(403);
    expect(put.body.message).toBe('You are no longer a teacher of this course');
    const del = await request(app)
      .delete(`/api/study-materials/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(del.status).toBe(403);
    const saved = await StudyMaterial.findById(item._id);
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe(item.title);
  });
});

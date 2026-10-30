import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Question } from '../../src/models/Question.model';
import { authCookie, bearer, createCourse, createUser, enrol, missingId } from '../factories';
import { createAnswerDoc, createQuestionDoc, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
const body = { title: '  How?  ', description: '  Please explain  ' };

describe('GET /api/qa/questions/course/:courseId', () => {
  it('lists the questions newest first with answer counts and staff flags', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const older = await createQuestionDoc(course, student);
    await createQuestionDoc(await createCourse(), student);
    const newer = await createQuestionDoc(course, student);
    await createAnswerDoc(older._id, student);
    await createAnswerDoc(older._id, teacher);
    const res = await request(app)
      .get(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((q: { _id: string }) => q._id)).toEqual([
      String(newer._id),
      String(older._id),
    ]);
    expect(res.body.data[1]).toMatchObject({
      answerCount: 2,
      staffAnswerCount: 1,
      hasStaffAnswer: true,
      isResolved: false,
    });
    expect(res.body.data[0]).toMatchObject({ answerCount: 0, hasStaffAnswer: false });
    expect(res.body.data[0].postedBy.email).toBeUndefined();
  });

  it('works with the Bearer header for an enrolled student', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`/api/qa/questions/course/${course._id}`)
      .set('Authorization', bearer(student));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [], total: 0 });
  });

  it('403 for a student who is not enrolled (course content)', async () => {
    const course = await createCourse();
    await createQuestionDoc(course, await createUser('Student'));
    const res = await request(app)
      .get(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(await createUser('Student')));
    expect(res.status).toBe(403);
  });

  it('400 malformed id, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .get('/api/qa/questions/course/not-an-id')
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(400);
    expect((await request(app).get(`/api/qa/questions/course/${missingId()}`)).status).toBe(401);
  });

  it('404 for an unknown course; 403 for a teacher of another course', async () => {
    const notFound = await request(app)
      .get(`/api/qa/questions/course/${missingId()}`)
      .set('Cookie', authCookie(await createUser('Admin')));
    expect(notFound.status).toBe(404);
    const { course } = await createTeacherWithCourse();
    const other = await createTeacherWithCourse();
    const denied = await request(app)
      .get(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(other.user));
    expect(denied.status).toBe(403);
  });
});

describe('POST /api/qa/questions/course/:courseId', () => {
  it('an enrolled student posts; fields trimmed, saved with the author', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(student))
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Question posted');
    expect(res.body.data).toMatchObject({
      title: 'How?',
      description: 'Please explain',
      isResolved: false,
      answerCount: 0,
      staffAnswerCount: 0,
      hasStaffAnswer: false,
    });
    expect(res.body.data.postedBy.name).toBe(student.name);
    const saved = await Question.findOne({ course: course._id });
    expect(String(saved?.postedBy)).toBe(String(student._id));
  });

  it('the assigned teacher posts', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(201);
  });

  it.each(ADMINS)('%s posts to an existing course', async (role) => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send(body);
    expect(res.status).toBe(201);
  });

  it('403 for a student who is not enrolled; nothing saved', async () => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(await createUser('Student')))
      .send(body);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You are not enrolled in this course');
    expect(await Question.countDocuments({ course: course._id })).toBe(0);
  });

  it('403 for a teacher of another course and for a teacher without profile', async () => {
    const { user } = await createTeacherWithCourse();
    const foreign = await createTeacherWithCourse();
    const a = await request(app)
      .post(`/api/qa/questions/course/${foreign.course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    const b = await request(app)
      .post(`/api/qa/questions/course/${foreign.course._id}`)
      .set('Cookie', authCookie(await createUser('Teacher')))
      .send(body);
    expect(a.status).toBe(403);
    expect(b.status).toBe(403);
  });

  it.each([
    ['blank title', { title: ' ', description: 'x' }],
    ['missing description', { title: 'x' }],
  ])('400 for %s', async (_n, payload) => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(student))
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when the title is an object', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .post(`/api/qa/questions/course/${course._id}`)
      .set('Cookie', authCookie(student))
      .send({ title: { $gt: '' }, description: 'x' });
    expect(res.status).toBe(400);
  });

  it('404 for a missing course, also for an admin; nothing saved', async () => {
    const ghost = missingId();
    const student = await request(app)
      .post(`/api/qa/questions/course/${ghost}`)
      .set('Cookie', authCookie(await createUser('Student')))
      .send(body);
    const admin = await request(app)
      .post(`/api/qa/questions/course/${ghost}`)
      .set('Cookie', authCookie(await createUser('Admin')))
      .send(body);
    expect(student.status).toBe(404);
    expect(admin.status).toBe(404);
    expect(await Question.countDocuments({ course: ghost })).toBe(0);
  });

  it('400 for a malformed course id (also for an admin)', async () => {
    const admin = await request(app)
      .post('/api/qa/questions/course/not-an-id')
      .set('Cookie', authCookie(await createUser('Admin')))
      .send(body);
    const student = await request(app)
      .post('/api/qa/questions/course/not-an-id')
      .set('Cookie', authCookie(await createUser('Student')))
      .send(body);
    expect(admin.status).toBe(400);
    expect(student.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect(
      (await request(app).post(`/api/qa/questions/course/${missingId()}`).send(body)).status,
    ).toBe(401);
  });
});

describe('GET /api/qa/questions/:id', () => {
  it('returns the question and its answers oldest first', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const question = await createQuestionDoc(course, student);
    const a1 = await createAnswerDoc(question._id, student, 'first');
    const a2 = await createAnswerDoc(question._id, teacher, 'second');
    await createAnswerDoc((await createQuestionDoc(course, student))._id, teacher, 'other');
    const res = await request(app)
      .get(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.data.question).toMatchObject({
      answerCount: 2,
      staffAnswerCount: 1,
      hasStaffAnswer: true,
    });
    expect(res.body.data.answers.map((a: { _id: string }) => a._id)).toEqual([
      String(a1._id),
      String(a2._id),
    ]);
    expect(res.body.data.answers[1].postedBy.role).toBe('Teacher');
  });

  it('403 for a student who is not enrolled in the question course', async () => {
    const course = await createCourse();
    const question = await createQuestionDoc(course, await createUser('Student'));
    const res = await request(app)
      .get(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(await createUser('Student')));
    expect(res.status).toBe(403);
  });

  it('403 for a teacher of another course; 200 for the assigned teacher', async () => {
    const { user, course } = await createTeacherWithCourse();
    const question = await createQuestionDoc(course, await createUser('Student'));
    const other = await createTeacherWithCourse();
    const denied = await request(app)
      .get(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(other.user));
    const allowed = await request(app)
      .get(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(user));
    expect(denied.status).toBe(403);
    expect(allowed.status).toBe(200);
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .get(`/api/qa/questions/${missingId()}`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).get('/api/qa/questions/not-an-id').set('Cookie', authCookie(student)))
        .status,
    ).toBe(400);
    expect((await request(app).get(`/api/qa/questions/${missingId()}`)).status).toBe(401);
  });
});

describe('PUT /api/qa/questions/:id', () => {
  it('the author edits; text trimmed', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    const question = await createQuestionDoc(course, student);
    const res = await request(app)
      .put(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(student))
      .send({ title: ' New ', description: ' Desc ' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Question updated');
    expect(res.body.data).toMatchObject({ title: 'New', description: 'Desc' });
    expect((await Question.findById(question._id))?.title).toBe('New');
  });

  it.each(ADMINS)('%s edits anyone question', async (role) => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .put(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send(body);
    expect(res.status).toBe(200);
  });

  it('403 for another student and for a teacher; unchanged', async () => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    for (const role of ['Student', 'Teacher'] as const) {
      const res = await request(app)
        .put(`/api/qa/questions/${question._id}`)
        .set('Cookie', authCookie(await createUser(role)))
        .send(body);
      expect(res.status).toBe(403);
    }
    expect((await Question.findById(question._id))?.title).toBe(question.title);
  });

  it('400 (not 500) when the title is not text; unchanged', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const res = await request(app)
      .put(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(student))
      .send({ title: { $ne: 1 }, description: 'x' });
    expect(res.status).toBe(400);
    expect((await Question.findById(question._id))?.title).toBe(question.title);
  });

  it('400 blank fields, 404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    expect(
      (
        await request(app)
          .put(`/api/qa/questions/${question._id}`)
          .set('Cookie', authCookie(student))
          .send({ title: '', description: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/qa/questions/${question._id}`)
          .set('Cookie', authCookie(student))
          .send({ title: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/qa/questions/${missingId()}`)
          .set('Cookie', authCookie(student))
          .send(body)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/qa/questions/not-an-id')
          .set('Cookie', authCookie(student))
          .send(body)
      ).status,
    ).toBe(400);
    expect((await request(app).put(`/api/qa/questions/${question._id}`).send(body)).status).toBe(
      401,
    );
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Answer } from '../../src/models/Answer.model';
import { authCookie, bearer, createCourse, createUser, enrol, missingId } from '../factories';
import { createAnswerDoc, createQuestionDoc, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];

describe('POST /api/qa/answers/question/:questionId', () => {
  it('an enrolled student answers; body trimmed and saved with the author', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const question = await createQuestionDoc(course, student);
    const res = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(student))
      .send({ body: '  Like so  ' });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Answer posted');
    expect(res.body.data.body).toBe('Like so');
    expect(res.body.data.postedBy.name).toBe(student.name);
    const saved = await Answer.findOne({ question: question._id });
    expect(String(saved?.postedBy)).toBe(String(student._id));
  });

  it('works with the Bearer header for the assigned teacher', async () => {
    const { user, course } = await createTeacherWithCourse();
    const question = await createQuestionDoc(course, await createUser('Student'));
    const res = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Authorization', bearer(user))
      .send({ body: 'Answer' });
    expect(res.status).toBe(201);
  });

  it.each(ADMINS)('%s answers', async (role) => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send({ body: 'Answer' });
    expect(res.status).toBe(201);
  });

  it('403 for a student who is not enrolled and a teacher of another course; nothing saved', async () => {
    const { course } = await createTeacherWithCourse();
    const question = await createQuestionDoc(course, await createUser('Student'));
    const outsider = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(await createUser('Student')))
      .send({ body: 'x' });
    const other = await createTeacherWithCourse();
    const teacher = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(other.user))
      .send({ body: 'x' });
    expect(outsider.status).toBe(403);
    expect(teacher.status).toBe(403);
    expect(await Answer.countDocuments({ question: question._id })).toBe(0);
  });

  it.each([{}, { body: '   ' }])('400 for body %j', async (payload) => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const question = await createQuestionDoc(course, student);
    const res = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(student))
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when body is an object', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const question = await createQuestionDoc(course, student);
    const res = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set('Cookie', authCookie(student))
      .send({ body: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('404 missing question, 400 malformed id, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .post(`/api/qa/answers/question/${missingId()}`)
          .set('Cookie', authCookie(student))
          .send({ body: 'x' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/qa/answers/question/not-an-id')
          .set('Cookie', authCookie(student))
          .send({ body: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (await request(app).post(`/api/qa/answers/question/${missingId()}`).send({ body: 'x' }))
        .status,
    ).toBe(401);
  });
});

describe('PUT /api/qa/answers/:id', () => {
  it('the author edits; body trimmed', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    const res = await request(app)
      .put(`/api/qa/answers/${answer._id}`)
      .set('Cookie', authCookie(student))
      .send({ body: ' Better ' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Answer updated');
    expect(res.body.data.body).toBe('Better');
    expect((await Answer.findById(answer._id))?.body).toBe('Better');
  });

  it.each(ADMINS)('%s edits anyone answer', async (role) => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    const res = await request(app)
      .put(`/api/qa/answers/${answer._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send({ body: 'x' });
    expect(res.status).toBe(200);
  });

  it('403 for another student and a teacher; unchanged', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    for (const role of ['Student', 'Teacher'] as const) {
      const res = await request(app)
        .put(`/api/qa/answers/${answer._id}`)
        .set('Cookie', authCookie(await createUser(role)))
        .send({ body: 'hijack' });
      expect(res.status).toBe(403);
    }
    expect((await Answer.findById(answer._id))?.body).toBe('Like this');
  });

  it('400 (not 500) when the new body is not text; unchanged', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    const res = await request(app)
      .put(`/api/qa/answers/${answer._id}`)
      .set('Cookie', authCookie(student))
      .send({ body: ['x'] });
    expect(res.status).toBe(400);
    expect((await Answer.findById(answer._id))?.body).toBe('Like this');
  });

  it('400 blank body, 404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    expect(
      (
        await request(app)
          .put(`/api/qa/answers/${answer._id}`)
          .set('Cookie', authCookie(student))
          .send({ body: ' ' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/qa/answers/${missingId()}`)
          .set('Cookie', authCookie(student))
          .send({ body: 'x' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/qa/answers/not-an-id')
          .set('Cookie', authCookie(student))
          .send({ body: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (await request(app).put(`/api/qa/answers/${answer._id}`).send({ body: 'x' })).status,
    ).toBe(401);
  });
});

describe('DELETE /api/qa/answers/:id', () => {
  it('the author deletes it', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    const res = await request(app)
      .delete(`/api/qa/answers/${answer._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Answer deleted' });
    expect(await Answer.findById(answer._id)).toBeNull();
  });

  it.each(ADMINS)('%s deletes anyone answer', async (role) => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    const res = await request(app)
      .delete(`/api/qa/answers/${answer._id}`)
      .set('Cookie', authCookie(await createUser(role)));
    expect(res.status).toBe(200);
  });

  it('403 for another student and a teacher; kept', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const answer = await createAnswerDoc(question._id, student);
    for (const role of ['Student', 'Teacher'] as const) {
      const res = await request(app)
        .delete(`/api/qa/answers/${answer._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(403);
    }
    expect(await Answer.findById(answer._id)).not.toBeNull();
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .delete(`/api/qa/answers/${missingId()}`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/qa/answers/not-an-id').set('Cookie', authCookie(student)))
        .status,
    ).toBe(400);
    expect((await request(app).delete(`/api/qa/answers/${missingId()}`)).status).toBe(401);
  });
});

describe('PATCH /api/qa/answers/:id/upvote', () => {
  it('toggles the upvote of the caller only', async () => {
    const course = await createCourse();
    const a = await createUser('Student');
    const b = await createUser('Student');
    await enrol(a, course);
    await enrol(b, course);
    const question = await createQuestionDoc(course, a);
    const answer = await createAnswerDoc(question._id, a);
    const up = await request(app)
      .patch(`/api/qa/answers/${answer._id}/upvote`)
      .set('Cookie', authCookie(a));
    expect(up.status).toBe(200);
    expect(up.body.data.upvotes).toEqual([String(a._id)]);
    const both = await request(app)
      .patch(`/api/qa/answers/${answer._id}/upvote`)
      .set('Cookie', authCookie(b));
    expect(both.body.data.upvotes).toEqual([String(a._id), String(b._id)]);
    const down = await request(app)
      .patch(`/api/qa/answers/${answer._id}/upvote`)
      .set('Cookie', authCookie(a));
    expect(down.body.data.upvotes).toEqual([String(b._id)]);
  });

  it('403 for a student who is not enrolled in the course; no vote stored', async () => {
    const author = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), author);
    const answer = await createAnswerDoc(question._id, author);
    const res = await request(app)
      .patch(`/api/qa/answers/${answer._id}/upvote`)
      .set('Cookie', authCookie(await createUser('Student')));
    expect(res.status).toBe(403);
    expect((await Answer.findById(answer._id))?.upvotes).toHaveLength(0);
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .patch(`/api/qa/answers/${missingId()}/upvote`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/qa/answers/not-an-id/upvote')
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(400);
    expect((await request(app).patch(`/api/qa/answers/${missingId()}/upvote`)).status).toBe(401);
  });
});

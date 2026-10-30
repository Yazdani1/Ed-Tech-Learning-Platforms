import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { QuizAttempt } from '../../src/models/QuizAttempt.model';
import { QuizBank } from '../../src/models/QuizBank.model';
import { authCookie, bearer, createCourse, createUser, missingId } from '../factories';
import {
  createQuizBankDoc,
  createQuizSectionDoc,
  createTeacherWithCourse,
  questionBody,
} from '../factories/quiz-subscription';

const BASE = '/api/quiz-bank';

describe('POST /api/quiz-banks', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    expect(
      (
        await request(app)
          .post(BASE)
          .send({ course: String(course._id), title: 'x' })
      ).status,
    ).toBe(401);
  });

  it('staff create a bank in a quiz section (201, trimmed, saved with creator)', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course);
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const user = await createUser(role);
      const res = await request(app)
        .post(BASE)
        .set('Cookie', authCookie(user))
        .send({
          course: String(course._id),
          quizSection: String(section._id),
          title: `  Bank ${role} `,
          description: ' desc ',
          isFreePreview: true,
        });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Quiz bank created');
      expect(res.body.data.title).toBe(`Bank ${role}`);
      expect(res.body.data.description).toBe('desc');
      expect(res.body.data.isFreePreview).toBe(true);
      expect(res.body.data.createdBy.name).toBe(user.name);
      const saved = await QuizBank.findById(res.body.data._id);
      expect(String(saved?.quizSection)).toBe(String(section._id));
      expect(saved?.questions).toHaveLength(0);
    }
  });

  it('creates a bank by context (Course) and the Bearer header works', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(BASE)
      .set('Authorization', bearer(user))
      .send({
        course: String(course._id),
        contextType: 'Course',
        contextId: String(course._id),
        title: 'Ctx',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.isFreePreview).toBe(false);
    expect(res.body.data.contextType).toBe('Course');
  });

  it('403 for students, other teachers and profile-less teachers; nothing saved', async () => {
    const course = await createCourse();
    const other = await createTeacherWithCourse();
    for (const user of [await createUser('Student'), other.user, await createUser('Teacher')]) {
      const res = await request(app)
        .post(BASE)
        .set('Cookie', authCookie(user))
        .send({
          course: String(course._id),
          contextType: 'Course',
          contextId: String(course._id),
          title: 'x',
        });
      expect(res.status).toBe(403);
    }
    expect(await QuizBank.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 for missing course/title, missing context and a bad contextType', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const cookie = authCookie(admin);
    const id = String(course._id);
    const post = (body: object) => request(app).post(BASE).set('Cookie', cookie).send(body);
    expect((await post({ title: 'x', quizSection: id })).status).toBe(400);
    expect((await post({ course: id, quizSection: id })).status).toBe(400);
    expect((await post({ course: id, title: '  ', quizSection: id })).status).toBe(400);
    expect((await post({ course: id, title: 'x' })).status).toBe(400);
    expect((await post({ course: id, title: 'x', contextType: 'Course' })).status).toBe(400);
    expect(
      (await post({ course: id, title: 'x', contextType: 'Nope', contextId: id })).status,
    ).toBe(400);
  });

  it('400 for malformed ids and operator objects, 404 for an unknown course', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    const post = (body: object) => request(app).post(BASE).set('Cookie', cookie).send(body);
    expect((await post({ course: 'bad', title: 'x', quizSection: missingId() })).status).toBe(400);
    expect(
      (await post({ course: { $ne: null }, title: 'x', quizSection: missingId() })).status,
    ).toBe(400);
    expect((await post({ course: missingId(), title: 'x', quizSection: missingId() })).status).toBe(
      404,
    );
  });
});

describe('PUT/DELETE /api/quiz-banks/:id', () => {
  it('401 without a token', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    expect((await request(app).put(`${BASE}/${bank._id}`).send({})).status).toBe(401);
    expect((await request(app).delete(`${BASE}/${bank._id}`)).status).toBe(401);
  });

  it('staff and the course teacher update the bank (trim, clear description)', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const admin = await createUser('Admin');
    const bank = await createQuizBankDoc(course, { description: 'old' });
    const res = await request(app)
      .put(`${BASE}/${bank._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: ' New ', description: '', isFreePreview: true });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Quiz bank updated');
    expect(res.body.data.title).toBe('New');
    const saved = await QuizBank.findById(bank._id);
    expect(saved?.description).toBeUndefined();
    expect(saved?.isFreePreview).toBe(true);
    const second = await request(app)
      .put(`${BASE}/${bank._id}`)
      .set('Cookie', authCookie(teacher))
      .send({ isFreePreview: false });
    expect(second.status).toBe(200);
  });

  it('403 on update/delete for students and other teachers; bank kept', async () => {
    const bank = await createQuizBankDoc(await createCourse(), { title: 'Keep' });
    const other = await createTeacherWithCourse();
    for (const user of [await createUser('Student'), other.user]) {
      const put = await request(app)
        .put(`${BASE}/${bank._id}`)
        .set('Cookie', authCookie(user))
        .send({ title: 'Hacked' });
      expect(put.status).toBe(403);
      expect(
        (await request(app).delete(`${BASE}/${bank._id}`).set('Cookie', authCookie(user))).status,
      ).toBe(403);
    }
    expect((await QuizBank.findById(bank._id))?.title).toBe('Keep');
  });

  it('400 when the title is set to blank', async () => {
    const admin = await createUser('Admin');
    const bank = await createQuizBankDoc(await createCourse());
    const res = await request(app)
      .put(`${BASE}/${bank._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: '  ' });
    expect(res.status).toBe(400);
  });

  it('400 (not 500) for non-text title/description on create and update', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const cookie = authCookie(admin);
    const create = (body: object) =>
      request(app)
        .post(BASE)
        .set('Cookie', cookie)
        .send({
          course: String(course._id),
          contextType: 'Course',
          contextId: String(course._id),
          ...body,
        });
    expect((await create({ title: 5 })).status).toBe(400);
    expect((await create({ title: ['x'] })).status).toBe(400);
    expect((await create({ title: 'ok', description: { a: 1 } })).status).toBe(400);
    expect(await QuizBank.countDocuments({ course: course._id })).toBe(0);
    const bank = await createQuizBankDoc(course, { title: 'Keep' });
    const put = (body: object) =>
      request(app).put(`${BASE}/${bank._id}`).set('Cookie', cookie).send(body);
    expect((await put({ title: 7 })).status).toBe(400);
    expect((await put({ description: ['x'] })).status).toBe(400);
    expect((await QuizBank.findById(bank._id))?.title).toBe('Keep');
  });

  it('delete removes the bank and its attempts', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(course);
    const other = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await QuizAttempt.create({ student: student._id, quizBank: bank._id, course: course._id });
    await QuizAttempt.create({ student: student._id, quizBank: other._id, course: course._id });
    const res = await request(app).delete(`${BASE}/${bank._id}`).set('Cookie', authCookie(teacher));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Quiz bank deleted');
    expect(await QuizBank.findById(bank._id)).toBeNull();
    expect(await QuizAttempt.countDocuments({ quizBank: bank._id })).toBe(0);
    expect(await QuizAttempt.countDocuments({ quizBank: other._id })).toBe(1);
  });

  it('404 for missing ids, 400 for malformed ids', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect((await request(app).put(`${BASE}/${missingId()}`).set('Cookie', cookie)).status).toBe(
      404,
    );
    expect((await request(app).delete(`${BASE}/${missingId()}`).set('Cookie', cookie)).status).toBe(
      404,
    );
    expect((await request(app).put(`${BASE}/bad`).set('Cookie', cookie)).status).toBe(400);
    expect((await request(app).delete(`${BASE}/bad`).set('Cookie', cookie)).status).toBe(400);
  });
});

describe('questions: POST/PUT/DELETE /api/quiz-banks/:id/questions', () => {
  it('401 without a token', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const q = String(bank.questions[0]._id);
    expect((await request(app).post(`${BASE}/${bank._id}/questions`).send({})).status).toBe(401);
    expect((await request(app).put(`${BASE}/${bank._id}/questions/${q}`).send({})).status).toBe(
      401,
    );
    expect((await request(app).delete(`${BASE}/${bank._id}/questions/${q}`)).status).toBe(401);
  });

  it('adds a question: 201, trimmed, order = position, saved with correct indices', async () => {
    const { user, course } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(course);
    const res = await request(app)
      .post(`${BASE}/${bank._id}/questions`)
      .set('Cookie', authCookie(user))
      .send(questionBody({ question: '  Why?  ', correctOptionIndices: [0, 3] }));
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Question added');
    const saved = await QuizBank.findById(bank._id);
    expect(saved?.questions).toHaveLength(3);
    const added = saved?.questions[2];
    expect(added?.question).toBe('Why?');
    expect(added?.order).toBe(2);
    expect(added?.correctOptionIndices).toEqual([0, 3]);
    expect(added?.options[2].explanation).toBe('because');
  });

  it('403 for students and other teachers; 404 for a missing bank; 400 for a malformed id', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const other = await createTeacherWithCourse();
    for (const user of [await createUser('Student'), other.user]) {
      const res = await request(app)
        .post(`${BASE}/${bank._id}/questions`)
        .set('Cookie', authCookie(user))
        .send(questionBody());
      expect(res.status).toBe(403);
    }
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect(
      (await request(app).post(`${BASE}/${missingId()}/questions`).set('Cookie', cookie).send({}))
        .status,
    ).toBe(404);
    expect(
      (await request(app).post(`${BASE}/bad/questions`).set('Cookie', cookie).send({})).status,
    ).toBe(400);
  });

  it('400 for invalid question bodies', async () => {
    const admin = await createUser('Admin');
    const bank = await createQuizBankDoc(await createCourse());
    const cookie = authCookie(admin);
    const post = (body: object) =>
      request(app).post(`${BASE}/${bank._id}/questions`).set('Cookie', cookie).send(body);
    const valid = questionBody();
    expect((await post({ ...valid, question: '  ' })).status).toBe(400);
    expect((await post({ ...valid, options: valid.options.slice(0, 3) })).status).toBe(400);
    expect((await post({ ...valid, options: 'abcd' })).status).toBe(400);
    expect((await post({ ...valid, correctOptionIndices: [] })).status).toBe(400);
    expect((await post({ ...valid, correctOptionIndices: [4] })).status).toBe(400);
    expect((await post({ ...valid, correctOptionIndices: [-1] })).status).toBe(400);
    expect((await post({ ...valid, correctOptionIndices: 1 })).status).toBe(400);
    expect(
      (
        await post({
          ...valid,
          options: [{ text: '' }, { text: 'B' }, { text: 'C' }, { text: 'D' }],
        })
      ).status,
    ).toBe(400);
    expect((await QuizBank.findById(bank._id))?.questions).toHaveLength(2);
  });

  it('400 (not 500) for non-text question, option text or explanation on add and update', async () => {
    const admin = await createUser('Admin');
    const bank = await createQuizBankDoc(await createCourse());
    const cookie = authCookie(admin);
    const post = (body: object) =>
      request(app).post(`${BASE}/${bank._id}/questions`).set('Cookie', cookie).send(body);
    const valid = questionBody();
    const opts = (first: unknown) => [first, ...valid.options.slice(1)];
    expect((await post({ ...valid, question: 5 })).status).toBe(400);
    expect((await post({ ...valid, options: opts({ text: 5 }) })).status).toBe(400);
    expect((await post({ ...valid, options: opts('A') })).status).toBe(400);
    expect((await post({ ...valid, options: opts(null) })).status).toBe(400);
    expect(
      (await post({ ...valid, options: opts({ text: 'A', explanation: ['x'] }) })).status,
    ).toBe(400);
    expect((await QuizBank.findById(bank._id))?.questions).toHaveLength(2);
    const qId = String(bank.questions[0]._id);
    const put = (body: object) =>
      request(app).put(`${BASE}/${bank._id}/questions/${qId}`).set('Cookie', cookie).send(body);
    expect((await put({ question: ['x'] })).status).toBe(400);
    expect((await put({ options: 'abcd' })).status).toBe(400);
    expect((await put({ options: opts({ text: {} }) })).status).toBe(400);
    expect((await QuizBank.findById(bank._id))?.questions[0].question).toBe(
      bank.questions[0].question,
    );
  });

  it('updates a question (partial) and 400/404 cases', async () => {
    const { user, course } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(course);
    const qId = String(bank.questions[0]._id);
    const cookie = authCookie(user);
    const put = (id: string, body: object) =>
      request(app).put(`${BASE}/${bank._id}/questions/${id}`).set('Cookie', cookie).send(body);
    const res = await put(qId, { question: ' Changed ', correctOptionIndices: [2] });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Question updated');
    const saved = await QuizBank.findById(bank._id);
    expect(saved?.questions[0].question).toBe('Changed');
    expect(saved?.questions[0].correctOptionIndices).toEqual([2]);
    expect(saved?.questions[0].options).toHaveLength(4);
    expect((await put(qId, { options: [{ text: 'a' }] })).status).toBe(400);
    expect((await put(qId, { correctOptionIndices: [9] })).status).toBe(400);
    expect((await put(qId, { correctOptionIndices: [] })).status).toBe(400);
    expect((await put(missingId(), { question: 'x' })).status).toBe(404);
    expect((await put('bad', { question: 'x' })).status).toBe(404);
    const student = await createUser('Student');
    const forbidden = await request(app)
      .put(`${BASE}/${bank._id}/questions/${qId}`)
      .set('Cookie', authCookie(student))
      .send({ question: 'x' });
    expect(forbidden.status).toBe(403);
  });

  it('deletes a question; 404 for an unknown question; 403 for students', async () => {
    const { user, course } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(course);
    const qId = String(bank.questions[0]._id);
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .delete(`${BASE}/${bank._id}/questions/${qId}`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(403);
    const res = await request(app)
      .delete(`${BASE}/${bank._id}/questions/${qId}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Question deleted');
    expect((await QuizBank.findById(bank._id))?.questions).toHaveLength(1);
    const again = await request(app)
      .delete(`${BASE}/${bank._id}/questions/${qId}`)
      .set('Cookie', authCookie(user));
    expect(again.status).toBe(404);
    const noBank = await request(app)
      .delete(`${BASE}/${missingId()}/questions/${qId}`)
      .set('Cookie', authCookie(user));
    expect(noBank.status).toBe(404);
  });
});

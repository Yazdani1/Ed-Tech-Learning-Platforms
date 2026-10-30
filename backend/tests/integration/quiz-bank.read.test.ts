import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { QuizAttempt } from '../../src/models/QuizAttempt.model';
import {
  authCookie,
  createCategory,
  createCourse,
  createCourseType,
  createUser,
  enrol,
  missingId,
} from '../factories';
import {
  createQuizBankDoc,
  createQuizSectionDoc,
  createTeacherWithCourse,
} from '../factories/quiz-subscription';

const BASE = '/api/quiz-bank';

const hasKey = (value: unknown, key: string): boolean => JSON.stringify(value).includes(`"${key}"`);

describe('GET /api/quiz-banks/course/:courseId and /context/:type/:id', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).get(`${BASE}/course/${course._id}`)).status).toBe(401);
    expect((await request(app).get(`${BASE}/context/Course/${course._id}`)).status).toBe(401);
  });

  it('lists the banks of a course oldest first with creator and total', async () => {
    const course = await createCourse();
    const first = await createQuizBankDoc(course, { title: 'First' });
    await createQuizBankDoc(course, { title: 'Second' });
    await createQuizBankDoc(await createCourse());
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`${BASE}/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data[0]._id).toBe(String(first._id));
    expect(res.body.data[0].createdBy).toHaveProperty('name');
  });

  it('SECURITY: a student never receives correct answers in the course list', async () => {
    const course = await createCourse();
    await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`${BASE}/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });

  it('SECURITY: a student not enrolled in the course gets 403 for the course list', async () => {
    const course = await createCourse();
    await createQuizBankDoc(course);
    const student = await createUser('Student');
    const res = await request(app)
      .get(`${BASE}/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(403);
  });

  it('lists the banks of a context; 400 for a malformed id', async () => {
    const course = await createCourse();
    await createQuizBankDoc(course, { title: 'Ctx' });
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    const res = await request(app)
      .get(`${BASE}/context/Course/${course._id}`)
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    const none = await request(app)
      .get(`${BASE}/context/Section/${missingId()}`)
      .set('Cookie', cookie);
    expect(none.body.data).toEqual([]);
    expect((await request(app).get(`${BASE}/course/bad`).set('Cookie', cookie)).status).toBe(400);
    expect(
      (await request(app).get(`${BASE}/context/Course/bad`).set('Cookie', cookie)).status,
    ).toBe(400);
  });

  it('context list: a bad contextType is rejected, not a 500', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .get(`${BASE}/context/Nope/${missingId()}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(400);
  });

  it('SECURITY: a student never receives correct answers in the context list', async () => {
    const course = await createCourse();
    await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`${BASE}/context/Course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });
});

describe('GET /api/quiz-banks/:id', () => {
  it('401 without a token, 404 missing, 400 malformed', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    expect((await request(app).get(`${BASE}/${bank._id}`)).status).toBe(401);
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect((await request(app).get(`${BASE}/${missingId()}`).set('Cookie', cookie)).status).toBe(
      404,
    );
    expect((await request(app).get(`${BASE}/bad`).set('Cookie', cookie)).status).toBe(400);
  });

  it('staff get the full bank including correct answers', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const admin = await createUser('Admin');
    const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(2);
    expect(res.body.data.questions[0].correctOptionIndices).toEqual([1]);
    expect(res.body.data.createdBy).toHaveProperty('name');
  });

  it('SECURITY: an enrolled student gets the questions but NOT the correct answers', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(2);
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });

  it('SECURITY: a student not enrolled gets 403', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const student = await createUser('Student');
    const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', authCookie(student));
    expect(res.status).toBe(403);
  });
});

describe('attempts: GET /:id/attempt, POST /:id/attempt/answer, DELETE /:id/attempt, GET /course/:id/my-attempts', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    expect((await request(app).get(`${BASE}/${bank._id}/attempt`)).status).toBe(401);
    expect((await request(app).post(`${BASE}/${bank._id}/attempt/answer`).send({})).status).toBe(
      401,
    );
    expect((await request(app).delete(`${BASE}/${bank._id}/attempt`)).status).toBe(401);
    expect((await request(app).get(`${BASE}/course/${course._id}/my-attempts`)).status).toBe(401);
  });

  it('my attempt is null before answering', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .get(`${BASE}/${bank._id}/attempt`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('the server computes correctness (single, multi in any order, wrong, empty) and ignores a client isCorrect', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const [q1, q2] = bank.questions.map((q) => String(q._id));
    const student = await createUser('Student');
    await enrol(student, course);
    const cookie = authCookie(student);
    const answer = (questionId: string, selectedOptionIndices: number[], extra: object = {}) =>
      request(app)
        .post(`${BASE}/${bank._id}/attempt/answer`)
        .set('Cookie', cookie)
        .send({ questionId, selectedOptionIndices, ...extra });
    const wrong = await answer(q1, [0], { isCorrect: true, score: 100 });
    expect(wrong.status).toBe(200);
    expect(wrong.body.data.answers[0].isCorrect).toBe(false);
    const again = await answer(q1, [1]);
    expect(again.status).toBe(409);
    expect(again.body.message).toBe('Question already answered; reset the attempt to try again');
    const multi = await answer(q2, [2, 0]);
    expect(multi.body.data.answers).toHaveLength(2);
    expect(multi.body.data.answers[0].isCorrect).toBe(false);
    expect(multi.body.data.answers[1].isCorrect).toBe(true);
    const saved = await QuizAttempt.find({ student: student._id, quizBank: bank._id });
    expect(saved).toHaveLength(1);
    expect(String(saved[0].course)).toBe(String(course._id));
    const mine = await request(app).get(`${BASE}/${bank._id}/attempt`).set('Cookie', cookie);
    expect(mine.body.data.answers).toHaveLength(2);
    expect(hasKey(mine.body, 'correctOptionIndices')).toBe(false);
  });

  it('a question cannot be answered twice in one attempt (409); after a reset it can', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const q1 = String(bank.questions[0]._id);
    const student = await createUser('Student');
    await enrol(student, course);
    const cookie = authCookie(student);
    const answer = (selectedOptionIndices: number[]) =>
      request(app)
        .post(`${BASE}/${bank._id}/attempt/answer`)
        .set('Cookie', cookie)
        .send({ questionId: q1, selectedOptionIndices });
    expect((await answer([])).body.data.answers[0].isCorrect).toBe(false);
    expect((await answer([1])).status).toBe(409);
    const saved = await QuizAttempt.findOne({ student: student._id, quizBank: bank._id });
    expect(saved?.answers).toHaveLength(1);
    expect(saved?.answers[0].isCorrect).toBe(false);
    await request(app).delete(`${BASE}/${bank._id}/attempt`).set('Cookie', cookie);
    const fresh = await answer([1]);
    expect(fresh.status).toBe(200);
    expect(fresh.body.data.answers[0].isCorrect).toBe(true);
  });

  it('SECURITY: a student cannot learn the answer without answering (answer response has no correct indices)', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const res = await request(app)
      .post(`${BASE}/${bank._id}/attempt/answer`)
      .set('Cookie', authCookie(student))
      .send({ questionId: String(bank.questions[0]._id), selectedOptionIndices: [3] });
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });

  it('SECURITY: a student not enrolled cannot submit answers', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/${bank._id}/attempt/answer`)
      .set('Cookie', authCookie(student))
      .send({ questionId: String(bank.questions[0]._id), selectedOptionIndices: [1] });
    expect(res.status).toBe(403);
    expect(await QuizAttempt.countDocuments({ student: student._id })).toBe(0);
  });

  it('400 for a missing questionId or non-array selection; 404 for unknown bank/question', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const cookie = authCookie(student);
    const post = (id: string, body: object) =>
      request(app).post(`${BASE}/${id}/attempt/answer`).set('Cookie', cookie).send(body);
    const q = String(bank.questions[0]._id);
    expect((await post(String(bank._id), { selectedOptionIndices: [1] })).status).toBe(400);
    expect((await post(String(bank._id), { questionId: q })).status).toBe(400);
    expect(
      (await post(String(bank._id), { questionId: q, selectedOptionIndices: '1' })).status,
    ).toBe(400);
    expect(
      (await post(String(bank._id), { questionId: q, selectedOptionIndices: ['a'] })).status,
    ).toBe(400);
    expect(
      (await post(String(bank._id), { questionId: missingId(), selectedOptionIndices: [1] }))
        .status,
    ).toBe(404);
    expect((await post(missingId(), { questionId: q, selectedOptionIndices: [1] })).status).toBe(
      404,
    );
    expect((await post('bad', { questionId: q, selectedOptionIndices: [1] })).status).toBe(400);
    expect(await QuizAttempt.countDocuments({ student: student._id })).toBe(0);
  });

  it('attempts are private: reading another student returns only your own; reset deletes only yours', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const a = await createUser('Student');
    const b = await createUser('Student');
    await enrol(a, course);
    await enrol(b, course);
    const q = String(bank.questions[0]._id);
    for (const s of [a, b]) {
      await request(app)
        .post(`${BASE}/${bank._id}/attempt/answer`)
        .set('Cookie', authCookie(s))
        .send({ questionId: q, selectedOptionIndices: [1] });
    }
    const mine = await request(app)
      .get(`${BASE}/course/${course._id}/my-attempts`)
      .set('Cookie', authCookie(a));
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(String(mine.body.data[0].student)).toBe(String(a._id));
    const reset = await request(app)
      .delete(`${BASE}/${bank._id}/attempt`)
      .set('Cookie', authCookie(a));
    expect(reset.status).toBe(200);
    expect(reset.body.message).toBe('Attempt reset');
    expect(await QuizAttempt.countDocuments({ student: a._id })).toBe(0);
    expect(await QuizAttempt.countDocuments({ student: b._id })).toBe(1);
    const again = await request(app)
      .delete(`${BASE}/${bank._id}/attempt`)
      .set('Cookie', authCookie(a));
    expect(again.status).toBe(200);
  });

  it('400 for a malformed id on attempt reads/reset', async () => {
    const student = await createUser('Student');
    const cookie = authCookie(student);
    expect((await request(app).get(`${BASE}/bad/attempt`).set('Cookie', cookie)).status).toBe(400);
    expect((await request(app).delete(`${BASE}/bad/attempt`).set('Cookie', cookie)).status).toBe(
      400,
    );
    expect(
      (await request(app).get(`${BASE}/course/bad/my-attempts`).set('Cookie', cookie)).status,
    ).toBe(400);
  });
});

describe('public: GET /api/quiz-banks/public/courses and /public/course/:courseId', () => {
  it('lists only courses with a free-preview bank or section, no auth needed', async () => {
    const freeBankCourse = await createCourse({ title: 'Has free bank' });
    await createQuizBankDoc(freeBankCourse, { isFreePreview: true });
    const freeSectionCourse = await createCourse({ title: 'Has free section' });
    await createQuizSectionDoc(freeSectionCourse, { isFreePreview: true });
    const lockedCourse = await createCourse({ title: 'Locked only' });
    await createQuizBankDoc(lockedCourse);
    const res = await request(app).get(`${BASE}/public/courses`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((c: { _id: string }) => c._id);
    expect(ids).toContain(String(freeBankCourse._id));
    expect(ids).toContain(String(freeSectionCourse._id));
    expect(ids).not.toContain(String(lockedCourse._id));
    expect(res.body.data[0]).not.toHaveProperty('createdBy');
  });

  it('filters by search, category, course type and pricing', async () => {
    const category = await createCategory();
    const type = await createCourseType();
    const target = await createCourse({
      title: 'Zebra unique title',
      category: category._id,
      courseType: type._id,
      pricing: 'Paid',
      price: 10,
    });
    const other = await createCourse({ title: 'Other' });
    await createQuizBankDoc(target, { isFreePreview: true });
    await createQuizBankDoc(other, { isFreePreview: true });
    const get = (query: string) => request(app).get(`${BASE}/public/courses?${query}`);
    const ids = (r: { body: { data: { _id: string }[] } }) => r.body.data.map((c) => c._id);
    expect(ids(await get('search=zebra unique'))).toEqual([String(target._id)]);
    expect(ids(await get(`categories=${category._id},bad`))).toEqual([String(target._id)]);
    expect(ids(await get(`courseTypes=${type._id}`))).toEqual([String(target._id)]);
    expect(ids(await get('pricing=Paid'))).toContain(String(target._id));
    expect(ids(await get('pricing=Paid'))).not.toContain(String(other._id));
  });

  it('treats operator objects in the query as input errors, not a 500', async () => {
    const res = await request(app).get(`${BASE}/public/courses?search[$ne]=x`);
    expect(res.status).toBeLessThan(500);
    const res2 = await request(app).get(`${BASE}/public/courses?categories[$ne]=x`);
    expect(res2.status).toBeLessThan(500);
  });

  it('shows free sections fully, free banks of locked sections, and counts the locked rest', async () => {
    const course = await createCourse();
    const freeSection = await createQuizSectionDoc(course, { isFreePreview: true, order: 0 });
    const lockedSection = await createQuizSectionDoc(course, { order: 1 });
    const hiddenSection = await createQuizSectionDoc(course, { order: 2 });
    await createQuizBankDoc(course, { quizSection: freeSection._id, title: 'In free section' });
    await createQuizBankDoc(course, {
      quizSection: lockedSection._id,
      title: 'Free in locked',
      isFreePreview: true,
    });
    await createQuizBankDoc(course, { quizSection: lockedSection._id, title: 'Locked 1' });
    await createQuizBankDoc(course, { quizSection: hiddenSection._id, title: 'Locked 2' });
    const res = await request(app).get(`${BASE}/public/course/${course._id}`);
    expect(res.status).toBe(200);
    const { sections, lockedBankCount, lockedQuestionCount, course: c } = res.body.data;
    expect(c._id).toBe(String(course._id));
    expect(sections.map((s: { title: string }) => s.title)).toEqual([
      freeSection.title,
      lockedSection.title,
    ]);
    expect(sections[0].banks.map((b: { title: string }) => b.title)).toEqual(['In free section']);
    expect(sections[1].banks.map((b: { title: string }) => b.title)).toEqual(['Free in locked']);
    expect(lockedBankCount).toBe(2);
    expect(lockedQuestionCount).toBe(4);
  });

  it('SECURITY: public responses never include correct answers', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course, { isFreePreview: true });
    await createQuizBankDoc(course, { quizSection: section._id });
    const res = await request(app).get(`${BASE}/public/course/${course._id}`);
    expect(res.status).toBe(200);
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });

  it('404 for an unknown course, 400 for a malformed id', async () => {
    expect((await request(app).get(`${BASE}/public/course/${missingId()}`)).status).toBe(404);
    expect((await request(app).get(`${BASE}/public/course/bad`)).status).toBe(400);
  });

  it('SECURITY: Draft or Private courses are not public (excluded from the list, 404 for the tree)', async () => {
    const draft = await createCourse({ status: 'Draft' });
    const hidden = await createCourse({ visibility: 'Private' });
    for (const course of [draft, hidden]) {
      await createQuizBankDoc(course, { isFreePreview: true });
      expect((await request(app).get(`${BASE}/public/course/${course._id}`)).status).toBe(404);
    }
    const ids = (await request(app).get(`${BASE}/public/courses`)).body.data.map(
      (c: { _id: string }) => c._id,
    );
    expect(ids).not.toContain(String(draft._id));
    expect(ids).not.toContain(String(hidden._id));
  });
});

describe('answers are revealed only after answering; free-preview access', () => {
  it('SECURITY: an enrolled student sees the answer and explanations only for questions they answered', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const [q1, q2] = bank.questions.map((q) => String(q._id));
    const student = await createUser('Student');
    await enrol(student, course);
    const cookie = authCookie(student);
    const before = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', cookie);
    expect(hasKey(before.body, 'explanation')).toBe(false);
    await request(app)
      .post(`${BASE}/${bank._id}/attempt/answer`)
      .set('Cookie', cookie)
      .send({ questionId: q1, selectedOptionIndices: [0] });
    const after = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', cookie);
    const byId = (id: string) =>
      after.body.data.questions.find((q: { _id: string }) => q._id === id);
    expect(byId(q1).correctOptionIndices).toEqual([1]);
    expect(byId(q1).options[1].explanation).toBe('B is right');
    expect(byId(q2)).not.toHaveProperty('correctOptionIndices');
    const list = await request(app).get(`${BASE}/course/${course._id}`).set('Cookie', cookie);
    expect(list.body.data[0].questions[1]).not.toHaveProperty('correctOptionIndices');
  });

  it('the teacher of the course gets the correct answers', async () => {
    const { user, course } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(course);
    const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.data.questions[0].correctOptionIndices).toEqual([1]);
  });

  it('a teacher of another course gets 403', async () => {
    const { user } = await createTeacherWithCourse();
    const bank = await createQuizBankDoc(await createCourse());
    const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', authCookie(user));
    expect(res.status).toBe(403);
  });

  it('any signed-in user may read and answer a free-preview bank (answers hidden until answered)', async () => {
    const course = await createCourse();
    const freeBank = await createQuizBankDoc(course, { isFreePreview: true });
    const section = await createQuizSectionDoc(course, { isFreePreview: true });
    const sectionBank = await createQuizBankDoc(course, { quizSection: section._id });
    const lockedBank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    const cookie = authCookie(student);
    for (const bank of [freeBank, sectionBank]) {
      const res = await request(app).get(`${BASE}/${bank._id}`).set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
    }
    const list = await request(app).get(`${BASE}/course/${course._id}`).set('Cookie', cookie);
    expect(list.status).toBe(200);
    const ids = list.body.data.map((b: { _id: string }) => b._id);
    expect(ids).toEqual(expect.arrayContaining([String(freeBank._id), String(sectionBank._id)]));
    expect(ids).not.toContain(String(lockedBank._id));
    const answer = await request(app)
      .post(`${BASE}/${freeBank._id}/attempt/answer`)
      .set('Cookie', cookie)
      .send({ questionId: String(freeBank.questions[0]._id), selectedOptionIndices: [1] });
    expect(answer.status).toBe(200);
    expect(answer.body.data.answers[0].isCorrect).toBe(true);
    const mine = await request(app)
      .get(`${BASE}/course/${course._id}/my-attempts`)
      .set('Cookie', cookie);
    expect(mine.status).toBe(200);
    expect(mine.body.data).toHaveLength(1);
    expect(
      (await request(app).get(`${BASE}/${lockedBank._id}/attempt`).set('Cookie', cookie)).status,
    ).toBe(403);
    expect(
      (await request(app).delete(`${BASE}/${lockedBank._id}/attempt`).set('Cookie', cookie)).status,
    ).toBe(403);
  });

  it('403 for my-attempts without access or free-preview banks; 404 for an unknown course', async () => {
    const course = await createCourse();
    await createQuizBankDoc(course);
    const cookie = authCookie(await createUser('Student'));
    const get = (path: string) => request(app).get(`${BASE}${path}`).set('Cookie', cookie);
    expect((await get(`/course/${course._id}/my-attempts`)).status).toBe(403);
    expect((await get(`/course/${missingId()}/my-attempts`)).status).toBe(404);
    expect((await get(`/course/${missingId()}`)).status).toBe(404);
  });

  it('400 for duplicate, out-of-range or non-integer selections; nothing saved', async () => {
    const course = await createCourse();
    const bank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    const q = String(bank.questions[0]._id);
    for (const selectedOptionIndices of [[1, 1], [4], [-1], [1.5], [null]]) {
      const res = await request(app)
        .post(`${BASE}/${bank._id}/attempt/answer`)
        .set('Cookie', authCookie(student))
        .send({ questionId: q, selectedOptionIndices });
      expect(res.status).toBe(400);
    }
    expect(await QuizAttempt.countDocuments({ student: student._id })).toBe(0);
  });
});

describe('POST /api/quiz-bank/public/:id/questions/:qId/check', () => {
  const check = (bankId: string, qId: string, body: object) =>
    request(app).post(`${BASE}/public/${bankId}/questions/${qId}/check`).send(body);

  it('checks an answer of a free-preview bank without auth and stores nothing', async () => {
    const bank = await createQuizBankDoc(await createCourse(), { isFreePreview: true });
    const id = String(bank._id);
    const q = String(bank.questions[0]._id);
    const attemptsBefore = await QuizAttempt.countDocuments();
    const right = await check(id, q, { selectedOptionIndices: [1] });
    expect(right.status).toBe(200);
    expect(right.body).toEqual({
      success: true,
      data: {
        isCorrect: true,
        correctOptionIndices: [1],
        explanations: [null, 'B is right', null, null],
      },
    });
    expect((await check(id, q, { selectedOptionIndices: [0] })).body.data.isCorrect).toBe(false);
    expect((await check(id, q, { selectedOptionIndices: [] })).body.data.isCorrect).toBe(false);
    expect(await QuizAttempt.countDocuments()).toBe(attemptsBefore);
  });

  it('works for a bank inside a free-preview section', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course, { isFreePreview: true });
    const bank = await createQuizBankDoc(course, { quizSection: section._id });
    const res = await check(String(bank._id), String(bank.questions[1]._id), {
      selectedOptionIndices: [2, 0],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.isCorrect).toBe(true);
  });

  it('SECURITY: 404 for a free-preview bank of a Draft or Private course', async () => {
    for (const overrides of [{ status: 'Draft' as const }, { visibility: 'Private' as const }]) {
      const bank = await createQuizBankDoc(await createCourse(overrides), { isFreePreview: true });
      const res = await check(String(bank._id), String(bank.questions[0]._id), {
        selectedOptionIndices: [1],
      });
      expect(res.status).toBe(404);
      expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
    }
  });

  it('SECURITY: 404 for a bank that is not free preview (answers not revealed)', async () => {
    const bank = await createQuizBankDoc(await createCourse());
    const res = await check(String(bank._id), String(bank.questions[0]._id), {
      selectedOptionIndices: [1],
    });
    expect(res.status).toBe(404);
    expect(hasKey(res.body, 'correctOptionIndices')).toBe(false);
  });

  it('400 for invalid selections or a malformed bank id; 404 for unknown bank or question', async () => {
    const bank = await createQuizBankDoc(await createCourse(), { isFreePreview: true });
    const id = String(bank._id);
    const q = String(bank.questions[0]._id);
    for (const selectedOptionIndices of [undefined, '1', ['a'], [1, 1], [4]]) {
      expect((await check(id, q, { selectedOptionIndices })).status).toBe(400);
    }
    expect((await check('bad', q, { selectedOptionIndices: [1] })).status).toBe(400);
    expect((await check(missingId(), q, { selectedOptionIndices: [1] })).status).toBe(404);
    expect((await check(id, missingId(), { selectedOptionIndices: [1] })).status).toBe(404);
  });

  it('SECURITY: the public course tree has no explanations; a regex-special search is literal', async () => {
    const course = await createCourse({ title: 'Plain title' });
    await createQuizBankDoc(course, { isFreePreview: true });
    const tree = await request(app).get(`${BASE}/public/course/${course._id}`);
    expect(hasKey(tree.body, 'explanation')).toBe(false);
    const search = await request(app).get(
      `${BASE}/public/courses?search=${encodeURIComponent('.*')}`,
    );
    expect(search.status).toBe(200);
    expect(search.body.data).toEqual([]);
  });
});

import request from 'supertest';
import app from '../../../src/app';
import { QuizBank } from '../../../src/models/QuizBank.model';
import { QuizSection } from '../../../src/models/QuizSection.model';
import { QuizAttempt } from '../../../src/models/QuizAttempt.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createTeacherProfile, makeObjectId } from '../../helpers/data.helper';

const options = [
  { text: 'A' },
  { text: 'B' },
  { text: 'C' },
  { text: 'D' },
];

describe('Quiz Sections API', () => {
  it('creates, lists, updates, and deletes quiz sections', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin);

    const create = await request(app).post('/api/quiz-sections').set(authHeaderFor(admin)).send({
      course: String(course._id),
      title: 'Section Quiz',
      isFreePreview: true,
    });
    expectSuccess(create, 201);
    expect(create.body.data).toMatchObject({ title: 'Section Quiz', order: 0, isFreePreview: true });

    const list = await request(app).get(`/api/quiz-sections/course/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const update = await request(app).put(`/api/quiz-sections/${create.body.data._id}`).set(authHeaderFor(admin)).send({ title: 'Updated Quiz', isFreePreview: false });
    expectSuccess(update);
    expect(update.body.data.title).toBe('Updated Quiz');

    const remove = await request(app).delete(`/api/quiz-sections/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('validates quiz section payloads and permissions', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin);

    const missing = await request(app).post('/api/quiz-sections').set(authHeaderFor(admin)).send({ course: String(course._id) });
    expectError(missing, 400, /course and title are required/);

    const unauthorized = await request(app).post('/api/quiz-sections').set(authHeaderFor(student)).send({ course: String(course._id), title: 'Nope' });
    expectError(unauthorized, 403, /Not authorized/);

    const missingUpdate = await request(app).put(`/api/quiz-sections/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'X' });
    expectError(missingUpdate, 404, /Quiz section not found/);
  });

  it('deletes quiz sections with their banks and attempts', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin);
    const section = await QuizSection.create({ course: course._id, title: 'With Banks', order: 0, createdBy: admin._id });
    const bank = await QuizBank.create({
      course: course._id,
      quizSection: section._id,
      title: 'Bank to cascade',
      createdBy: admin._id,
      questions: [{ question: 'Q', options, correctOptionIndices: [0], order: 0 }],
    });
    await QuizAttempt.create({ student: student._id, course: course._id, quizBank: bank._id, answers: [] });

    const remove = await request(app).delete(`/api/quiz-sections/${section._id}`).set(authHeaderFor(admin));

    expectSuccess(remove);
    expect(await QuizBank.findById(bank._id)).toBeNull();
    expect(await QuizAttempt.countDocuments({ quizBank: bank._id })).toBe(0);
  });
});

describe('Quiz Bank API', () => {
  it('creates, reads, updates, and deletes quiz banks with questions and attempts', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin);
    const section = await QuizSection.create({ course: course._id, title: 'S1', order: 0, createdBy: admin._id, isFreePreview: true });

    const create = await request(app).post('/api/quiz-bank').set(authHeaderFor(admin)).send({
      course: String(course._id),
      quizSection: String(section._id),
      title: 'Quiz 1',
      description: 'Basics',
      isFreePreview: true,
    });
    expectSuccess(create, 201);

    const getCourse = await request(app).get(`/api/quiz-bank/course/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(getCourse);
    expect(getCourse.body.total).toBe(1);

    const getOne = await request(app).get(`/api/quiz-bank/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(getOne);

    const update = await request(app).put(`/api/quiz-bank/${create.body.data._id}`).set(authHeaderFor(admin)).send({ title: 'Updated', description: '', isFreePreview: false });
    expectSuccess(update);
    expect(update.body.data.title).toBe('Updated');

    const addQuestion = await request(app).post(`/api/quiz-bank/${create.body.data._id}/questions`).set(authHeaderFor(admin)).send({
      question: 'Pick A',
      options,
      correctOptionIndices: [0],
    });
    expectSuccess(addQuestion, 201);
    const questionId = addQuestion.body.data.questions[0]._id;

    const updateQuestion = await request(app).put(`/api/quiz-bank/${create.body.data._id}/questions/${questionId}`).set(authHeaderFor(admin)).send({
      question: 'Pick A again',
      options,
      correctOptionIndices: [0, 1],
    });
    expectSuccess(updateQuestion);

    const answer = await request(app).post(`/api/quiz-bank/${create.body.data._id}/attempt/answer`).set(authHeaderFor(student)).send({
      questionId,
      selectedOptionIndices: [1, 0],
    });
    expectSuccess(answer);
    expect(answer.body.data.answers[0].isCorrect).toBe(true);

    const attempt = await request(app).get(`/api/quiz-bank/${create.body.data._id}/attempt`).set(authHeaderFor(student));
    expectSuccess(attempt);
    expect(attempt.body.data.answers).toHaveLength(1);

    const attempts = await request(app).get(`/api/quiz-bank/course/${course._id}/my-attempts`).set(authHeaderFor(student));
    expectSuccess(attempts);
    expect(attempts.body.data).toHaveLength(1);

    const reset = await request(app).delete(`/api/quiz-bank/${create.body.data._id}/attempt`).set(authHeaderFor(student));
    expectSuccess(reset);

    const deleteQuestion = await request(app).delete(`/api/quiz-bank/${create.body.data._id}/questions/${questionId}`).set(authHeaderFor(admin));
    expectSuccess(deleteQuestion);

    const remove = await request(app).delete(`/api/quiz-bank/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(await QuizAttempt.countDocuments({ quizBank: create.body.data._id })).toBe(0);
  });

  it('supports context quizzes and public free-preview endpoints', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const course = await createCourse(admin, { status: 'Published', visibility: 'Public' });

    const bank = await QuizBank.create({
      course: course._id,
      contextType: 'Course',
      contextId: course._id,
      title: 'Public Quiz',
      isFreePreview: true,
      createdBy: admin._id,
      questions: [{ question: 'Q', options, correctOptionIndices: [0], order: 0 }],
    });

    const context = await request(app).get(`/api/quiz-bank/context/Course/${course._id}`).set(authHeaderFor(admin));
    expectSuccess(context);
    expect(context.body.total).toBe(1);

    const courses = await request(app).get('/api/quiz-bank/public/courses?pricing=Free,Paid');
    expectSuccess(courses);
    expect(courses.body.data).toHaveLength(1);

    const publicBanks = await request(app).get(`/api/quiz-bank/public/course/${course._id}`);
    expectSuccess(publicBanks);
    expect(publicBanks.body.data.lockedBankCount).toBe(0);
    expect(String(bank._id)).toBeTruthy();
  });

  it('validates quiz bank payloads, question payloads, attempts, and teacher authorization', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id] });
    const bank = await QuizBank.create({ course: course._id, contextType: 'Course', contextId: course._id, title: 'Bank', createdBy: admin._id });

    const missing = await request(app).post('/api/quiz-bank').set(authHeaderFor(admin)).send({ course: String(course._id) });
    expectError(missing, 400, /course and title are required/);

    const missingContext = await request(app).post('/api/quiz-bank').set(authHeaderFor(admin)).send({ course: String(course._id), title: 'No context' });
    expectError(missingContext, 400, /quizSection or contextType/);

    const invalidContext = await request(app).post('/api/quiz-bank').set(authHeaderFor(admin)).send({ course: String(course._id), title: 'Bad', contextType: 'Bad', contextId: String(course._id) });
    expectError(invalidContext, 400, /contextType/);

    const teacherAllowed = await request(app).post('/api/quiz-bank').set(authHeaderFor(teacherUser)).send({ course: String(course._id), title: 'Teacher bank', contextType: 'Course', contextId: String(course._id) });
    expectSuccess(teacherAllowed, 201);

    const unauthorized = await request(app).put(`/api/quiz-bank/${bank._id}`).set(authHeaderFor(student)).send({ title: 'Nope' });
    expectError(unauthorized, 403, /Not authorized/);

    const badQuestion = await request(app).post(`/api/quiz-bank/${bank._id}/questions`).set(authHeaderFor(admin)).send({ question: 'Q', options: options.slice(0, 2), correctOptionIndices: [0] });
    expectError(badQuestion, 400, /Exactly 4 options/);

    const badCorrect = await request(app).post(`/api/quiz-bank/${bank._id}/questions`).set(authHeaderFor(admin)).send({ question: 'Q', options, correctOptionIndices: [5] });
    expectError(badCorrect, 400, /correctOptionIndices/);

    const noQuestionId = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({ selectedOptionIndices: [] });
    expectError(noQuestionId, 400, /questionId is required/);

    const missingPublicCourse = await request(app).get(`/api/quiz-bank/public/course/${makeObjectId()}`);
    expectError(missingPublicCourse, 404, /Course not found/);
  });

  it('covers quiz bank authorization, missing bank, repeat attempts, and public filters', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const unassignedTeacher = await createTestUser({ role: 'Teacher', email: 'teacher.unassigned@example.com' });
    await createTeacherProfile({ userId: unassignedTeacher._id });
    const course = await createCourse(admin, {
      title: 'Filtered Quiz Course',
      status: 'Published',
      visibility: 'Public',
      pricing: 'Paid',
      price: 50,
    });
    const section = await QuizSection.create({
      course: course._id,
      title: 'Visible Section',
      order: 0,
      isFreePreview: true,
      createdBy: admin._id,
    });
    const bank = await QuizBank.create({
      course: course._id,
      quizSection: section._id,
      title: 'Filter Bank',
      description: 'Initial',
      isFreePreview: true,
      createdBy: admin._id,
      questions: [{ question: 'Pick A', options, correctOptionIndices: [0], order: 0 }],
    });
    const questionId = bank.questions[0]._id;

    const missingGet = await request(app).get(`/api/quiz-bank/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingGet, 404, /Quiz bank not found/);

    const missingUpdateBank = await request(app).put(`/api/quiz-bank/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'No bank' });
    expectError(missingUpdateBank, 404, /Quiz bank not found/);

    const deniedCreate = await request(app).post('/api/quiz-bank').set(authHeaderFor(unassignedTeacher)).send({
      course: String(course._id),
      title: 'Denied',
      contextType: 'Course',
      contextId: String(course._id),
    });
    expectError(deniedCreate, 403, /Not authorized/);

    const deniedDelete = await request(app).delete(`/api/quiz-bank/${bank._id}`).set(authHeaderFor(student));
    expectError(deniedDelete, 403, /Not authorized/);

    const missingDeleteBank = await request(app).delete(`/api/quiz-bank/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingDeleteBank, 404, /Quiz bank not found/);

    const missingAddQuestionBank = await request(app).post(`/api/quiz-bank/${makeObjectId()}/questions`).set(authHeaderFor(admin)).send({
      question: 'Q',
      options,
      correctOptionIndices: [0],
    });
    expectError(missingAddQuestionBank, 404, /Quiz bank not found/);

    const deniedAddQuestion = await request(app).post(`/api/quiz-bank/${bank._id}/questions`).set(authHeaderFor(student)).send({
      question: 'Q',
      options,
      correctOptionIndices: [0],
    });
    expectError(deniedAddQuestion, 403, /Not authorized/);

    const missingQuestionText = await request(app).post(`/api/quiz-bank/${bank._id}/questions`).set(authHeaderFor(admin)).send({
      options,
      correctOptionIndices: [0],
    });
    expectError(missingQuestionText, 400, /Question text is required/);

    const updateMissingBankQuestion = await request(app)
      .put(`/api/quiz-bank/${makeObjectId()}/questions/${questionId}`)
      .set(authHeaderFor(admin))
      .send({ question: 'No bank' });
    expectError(updateMissingBankQuestion, 404, /Quiz bank not found/);

    const deniedUpdateQuestion = await request(app)
      .put(`/api/quiz-bank/${bank._id}/questions/${questionId}`)
      .set(authHeaderFor(student))
      .send({ question: 'Nope' });
    expectError(deniedUpdateQuestion, 403, /Not authorized/);

    const invalidUpdateOptions = await request(app)
      .put(`/api/quiz-bank/${bank._id}/questions/${questionId}`)
      .set(authHeaderFor(admin))
      .send({ options: options.slice(0, 3) });
    expectError(invalidUpdateOptions, 400, /Exactly 4 options/);

    const missingDeleteQuestionBank = await request(app)
      .delete(`/api/quiz-bank/${makeObjectId()}/questions/${questionId}`)
      .set(authHeaderFor(admin));
    expectError(missingDeleteQuestionBank, 404, /Quiz bank not found/);

    const deniedDeleteQuestion = await request(app)
      .delete(`/api/quiz-bank/${bank._id}/questions/${questionId}`)
      .set(authHeaderFor(student));
    expectError(deniedDeleteQuestion, 403, /Not authorized/);

    const firstAnswer = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({
      questionId,
      selectedOptionIndices: [0],
    });
    expectSuccess(firstAnswer);
    expect(firstAnswer.body.data.answers[0].isCorrect).toBe(true);

    const changedAnswer = await request(app).post(`/api/quiz-bank/${bank._id}/attempt/answer`).set(authHeaderFor(student)).send({
      questionId,
      selectedOptionIndices: [1],
    });
    expectSuccess(changedAnswer);
    expect(changedAnswer.body.data.answers).toHaveLength(1);
    expect(changedAnswer.body.data.answers[0].isCorrect).toBe(false);

    const missingAttemptBank = await request(app).post(`/api/quiz-bank/${makeObjectId()}/attempt/answer`).set(authHeaderFor(student)).send({
      questionId,
      selectedOptionIndices: [0],
    });
    expectError(missingAttemptBank, 404, /Quiz bank not found/);

    const byFilters = await request(app).get(
      `/api/quiz-bank/public/courses?search=Filtered&categories=${course.category}&courseTypes=${course.courseType}&pricing=Paid,Unknown`,
    );
    expectSuccess(byFilters);
    expect(byFilters.body.data).toHaveLength(1);

    const ignoredInvalidFilters = await request(app).get('/api/quiz-bank/public/courses?categories=bad&courseTypes=bad&pricing=Unknown');
    expectSuccess(ignoredInvalidFilters);
    expect(ignoredInvalidFilters.body.data.length).toBeGreaterThanOrEqual(1);
  });
});

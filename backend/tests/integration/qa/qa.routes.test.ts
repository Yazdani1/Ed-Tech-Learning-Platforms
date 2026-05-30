import request from 'supertest';
import app from '../../../src/app';
import { Answer } from '../../../src/models/Answer.model';
import { Enrollment } from '../../../src/models/Enrollment.model';
import { Question } from '../../../src/models/Question.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createTeacherProfile, makeObjectId } from '../../helpers/data.helper';

describe('Q&A API', () => {
  it('lets enrolled students ask, update, resolve, upvote, answer, and delete Q&A content', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const course = await createCourse(admin);
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'free' });

    const create = await request(app).post(`/api/qa/questions/course/${course._id}`).set(authHeaderFor(student)).send({
      title: 'How does testing work?',
      description: 'I need details',
    });
    expectSuccess(create, 201);

    const list = await request(app).get(`/api/qa/questions/course/${course._id}`).set(authHeaderFor(student));
    expectSuccess(list);
    expect(list.body.total).toBe(1);

    const update = await request(app).put(`/api/qa/questions/${create.body.data._id}`).set(authHeaderFor(student)).send({
      title: 'Updated question',
      description: 'Updated body',
    });
    expectSuccess(update);

    const upvote = await request(app).patch(`/api/qa/questions/${create.body.data._id}/upvote`).set(authHeaderFor(student));
    expectSuccess(upvote);
    expect(upvote.body.data.upvotes).toContain(String(student._id));

    const resolve = await request(app).patch(`/api/qa/questions/${create.body.data._id}/resolve`).set(authHeaderFor(student)).send({ isResolved: true });
    expectSuccess(resolve);
    expect(resolve.body.data.isResolved).toBe(true);

    const answer = await request(app).post(`/api/qa/answers/question/${create.body.data._id}`).set(authHeaderFor(student)).send({ body: 'My own follow-up answer' });
    expectSuccess(answer, 201);

    const getWithAnswers = await request(app).get(`/api/qa/questions/${create.body.data._id}`).set(authHeaderFor(student));
    expectSuccess(getWithAnswers);
    expect(getWithAnswers.body.data.answers).toHaveLength(1);

    const updateAnswer = await request(app).put(`/api/qa/answers/${answer.body.data._id}`).set(authHeaderFor(student)).send({ body: 'Updated answer' });
    expectSuccess(updateAnswer);

    const upvoteAnswer = await request(app).patch(`/api/qa/answers/${answer.body.data._id}/upvote`).set(authHeaderFor(admin));
    expectSuccess(upvoteAnswer);
    expect(upvoteAnswer.body.data.upvotes).toContain(String(admin._id));

    const deleteAnswer = await request(app).delete(`/api/qa/answers/${answer.body.data._id}`).set(authHeaderFor(student));
    expectSuccess(deleteAnswer);

    const deleteQuestion = await request(app).delete(`/api/qa/questions/${create.body.data._id}`).set(authHeaderFor(student));
    expectSuccess(deleteQuestion);
  });

  it('supports staff overview grouping and assigned teacher posting', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const course = await createCourse(admin, { teachers: [teacher._id] });
    await Question.create({ course: course._id, title: 'Open', description: 'Body', postedBy: admin._id });

    const overview = await request(app).get('/api/qa/admin/course-questions').set(authHeaderFor(admin));
    expectSuccess(overview);
    expect(overview.body.total).toBe(1);

    const teacherQuestion = await request(app).post(`/api/qa/questions/course/${course._id}`).set(authHeaderFor(teacherUser)).send({
      title: 'Teacher question',
      description: 'Allowed',
    });
    expectSuccess(teacherQuestion, 201);
  });

  it('validates Q&A payloads and authorization boundaries', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const otherStudent = await createTestUser({ role: 'Student', email: 'other@example.com' });
    const course = await createCourse(admin);
    const question = await Question.create({ course: course._id, title: 'Q', description: 'D', postedBy: student._id });
    const answer = await Answer.create({ question: question._id, body: 'A', postedBy: student._id });

    const notEnrolled = await request(app).post(`/api/qa/questions/course/${course._id}`).set(authHeaderFor(otherStudent)).send({ title: 'Q', description: 'D' });
    expectError(notEnrolled, 403, /not enrolled/);

    const missingTitle = await request(app).post(`/api/qa/questions/course/${course._id}`).set(authHeaderFor(admin)).send({ description: 'D' });
    expectError(missingTitle, 400, /Title is required/);

    const badResolve = await request(app).patch(`/api/qa/questions/${question._id}/resolve`).set(authHeaderFor(admin)).send({ isResolved: 'yes' });
    expectError(badResolve, 400, /isResolved/);

    const blockedUpdate = await request(app).put(`/api/qa/questions/${question._id}`).set(authHeaderFor(otherStudent)).send({ title: 'X', description: 'Y' });
    expectError(blockedUpdate, 403, /not authorized/i);

    const missingQuestion = await request(app).get(`/api/qa/questions/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingQuestion, 404, /Question not found/);

    const emptyAnswer = await request(app).post(`/api/qa/answers/question/${question._id}`).set(authHeaderFor(admin)).send({ body: '   ' });
    expectError(emptyAnswer, 400, /Answer body is required/);

    const blockedAnswerUpdate = await request(app).put(`/api/qa/answers/${answer._id}`).set(authHeaderFor(otherStudent)).send({ body: 'X' });
    expectError(blockedAnswerUpdate, 403, /not authorized/i);

    const missingAnswer = await request(app).delete(`/api/qa/answers/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingAnswer, 404, /Answer not found/);
  });
});

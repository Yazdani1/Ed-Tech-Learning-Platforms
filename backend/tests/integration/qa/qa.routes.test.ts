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

  it('covers Q&A edge cases for staff grouping, assignment, toggles, and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const teacherUser = await createTestUser({ role: 'Teacher', email: 'teacher@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const otherStudent = await createTestUser({ role: 'Student', email: 'other@example.com' });
    const teacher = await createTeacherProfile({ userId: teacherUser._id });
    const courseA = await createCourse(admin, { title: 'Alpha Course', teachers: [teacher._id] });
    const courseB = await createCourse(admin, { title: 'Beta Course' });
    await Enrollment.create({ student: student._id, course: courseA._id, enrollmentType: 'free' });
    const question = await Question.create({ course: courseA._id, title: 'Q', description: 'D', postedBy: student._id });
    await Question.create({ course: courseB._id, title: 'Q2', description: 'D2', postedBy: admin._id });
    const answer = await Answer.create({ question: question._id, body: 'A', postedBy: admin._id });

    const overview = await request(app).get('/api/qa/admin/course-questions').set(authHeaderFor(admin));
    expectSuccess(overview);
    expect(overview.body.data.map((group: { course: { title: string } }) => group.course.title)).toEqual(['Alpha Course', 'Beta Course']);

    const emptyCourse = await createCourse(admin, { title: 'No Questions Course' });
    const emptyCourseQuestions = await request(app).get(`/api/qa/questions/course/${emptyCourse._id}`).set(authHeaderFor(student));
    expectSuccess(emptyCourseQuestions);
    expect(emptyCourseQuestions.body.total).toBe(0);

    const unassignedTeacherAnswer = await request(app)
      .post(`/api/qa/answers/question/${question._id}`)
      .set(authHeaderFor(await createTestUser({ role: 'Teacher', email: 'unassigned.teacher@example.com' })))
      .send({ body: 'Blocked' });
    expectError(unassignedTeacherAnswer, 403, /not assigned/);

    const missingAnswerQuestion = await request(app)
      .post(`/api/qa/answers/question/${makeObjectId()}`)
      .set(authHeaderFor(admin))
      .send({ body: 'No question' });
    expectError(missingAnswerQuestion, 404, /Question not found/);

    const teacherResolve = await request(app).patch(`/api/qa/questions/${question._id}/resolve`).set(authHeaderFor(teacherUser)).send({ isResolved: true });
    expectSuccess(teacherResolve);

    const blockedResolve = await request(app).patch(`/api/qa/questions/${question._id}/resolve`).set(authHeaderFor(otherStudent)).send({ isResolved: false });
    expectError(blockedResolve, 403, /Not authorized/);

    const missingResolve = await request(app).patch(`/api/qa/questions/${makeObjectId()}/resolve`).set(authHeaderFor(admin)).send({ isResolved: true });
    expectError(missingResolve, 404, /Question not found/);

    const upvoteQuestion = await request(app).patch(`/api/qa/questions/${question._id}/upvote`).set(authHeaderFor(student));
    expectSuccess(upvoteQuestion);
    const unvoteQuestion = await request(app).patch(`/api/qa/questions/${question._id}/upvote`).set(authHeaderFor(student));
    expectSuccess(unvoteQuestion);
    expect(unvoteQuestion.body.data.upvotes).not.toContain(String(student._id));

    const missingQuestionUpvote = await request(app).patch(`/api/qa/questions/${makeObjectId()}/upvote`).set(authHeaderFor(student));
    expectError(missingQuestionUpvote, 404, /Question not found/);

    const blockedAnswerDelete = await request(app).delete(`/api/qa/answers/${answer._id}`).set(authHeaderFor(otherStudent));
    expectError(blockedAnswerDelete, 403, /not authorized/i);

    const missingAnswerUpdate = await request(app).put(`/api/qa/answers/${makeObjectId()}`).set(authHeaderFor(admin)).send({ body: 'No answer' });
    expectError(missingAnswerUpdate, 404, /Answer not found/);

    const emptyAnswerUpdate = await request(app).put(`/api/qa/answers/${answer._id}`).set(authHeaderFor(admin)).send({ body: '   ' });
    expectError(emptyAnswerUpdate, 400, /Answer body is required/);

    const upvoteAnswer = await request(app).patch(`/api/qa/answers/${answer._id}/upvote`).set(authHeaderFor(student));
    expectSuccess(upvoteAnswer);
    const unvoteAnswer = await request(app).patch(`/api/qa/answers/${answer._id}/upvote`).set(authHeaderFor(student));
    expectSuccess(unvoteAnswer);
    expect(unvoteAnswer.body.data.upvotes).not.toContain(String(student._id));

    const missingAnswerUpvote = await request(app).patch(`/api/qa/answers/${makeObjectId()}/upvote`).set(authHeaderFor(student));
    expectError(missingAnswerUpvote, 404, /Answer not found/);
  });
});

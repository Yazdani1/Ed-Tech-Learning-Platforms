import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Answer } from '../../src/models/Answer.model';
import { Question } from '../../src/models/Question.model';
import {
  authCookie,
  createCourse,
  createUser,
  createUsersForAllRoles,
  missingId,
} from '../factories';
import { createAnswerDoc, createQuestionDoc } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];

describe('DELETE /api/qa/questions/:id', () => {
  it('the author deletes the question and its answers', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const keep = await createQuestionDoc(await createCourse(), student);
    await createAnswerDoc(question._id, student);
    await createAnswerDoc(keep._id, student);
    const res = await request(app)
      .delete(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Question deleted' });
    expect(await Question.findById(question._id)).toBeNull();
    expect(await Answer.countDocuments({ question: question._id })).toBe(0);
    expect(await Answer.countDocuments({ question: keep._id })).toBe(1);
  });

  it.each(ADMINS)('%s deletes anyone question', async (role) => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .delete(`/api/qa/questions/${question._id}`)
      .set('Cookie', authCookie(await createUser(role)));
    expect(res.status).toBe(200);
  });

  it('403 for another student and for a teacher; kept', async () => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    for (const role of ['Student', 'Teacher'] as const) {
      const res = await request(app)
        .delete(`/api/qa/questions/${question._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(403);
    }
    expect(await Question.findById(question._id)).not.toBeNull();
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .delete(`/api/qa/questions/${missingId()}`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/qa/questions/not-an-id').set('Cookie', authCookie(student)))
        .status,
    ).toBe(400);
    expect((await request(app).delete(`/api/qa/questions/${missingId()}`)).status).toBe(401);
  });
});

describe('GET /api/qa/admin/course-questions', () => {
  it('groups unresolved questions by course (sorted by title) with counts', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const courseB = await createCourse({ title: 'ZZ course' });
    const courseA = await createCourse({ title: 'AA course' });
    const q1 = await createQuestionDoc(courseB, student);
    const q2 = await createQuestionDoc(courseA, student);
    const resolved = await createQuestionDoc(courseA, student);
    await Question.updateOne({ _id: resolved._id }, { isResolved: true });
    await createAnswerDoc(q2._id, admin);
    const res = await request(app)
      .get('/api/qa/admin/course-questions')
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    const groups = res.body.data as {
      course: { _id: string; title: string };
      questions: { _id: string; answerCount: number; course: string }[];
    }[];
    const mine = groups.filter((g) =>
      [String(courseA._id), String(courseB._id)].includes(g.course._id),
    );
    expect(mine.map((g) => g.course.title)).toEqual(['AA course', 'ZZ course']);
    expect(mine[0].questions.map((q) => q._id)).toEqual([String(q2._id)]);
    expect(mine[0].questions[0]).toMatchObject({ answerCount: 1, course: String(courseA._id) });
    expect(mine[1].questions.map((q) => q._id)).toEqual([String(q1._id)]);
    expect(res.body.total).toBe(groups.length);
  });

  it('401 without a token', async () => {
    expect((await request(app).get('/api/qa/admin/course-questions')).status).toBe(401);
  });

  it.each<UserRole>(['Teacher', 'Student'])('403 for %s', async (role) => {
    const users = await createUsersForAllRoles();
    const res = await request(app)
      .get('/api/qa/admin/course-questions')
      .set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(403);
  });
});

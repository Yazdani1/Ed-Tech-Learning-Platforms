import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Question } from '../../src/models/Question.model';
import { authCookie, createCourse, createUser, enrol, missingId } from '../factories';
import { createQuestionDoc, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];

describe('PATCH /api/qa/questions/:id/resolve', () => {
  it('the author resolves and reopens; resolver fields are set and cleared', async () => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const resolved = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(student))
      .send({ isResolved: true });
    expect(resolved.status).toBe(200);
    expect(resolved.body.message).toBe('Question marked as resolved');
    expect(resolved.body.data.isResolved).toBe(true);
    expect(resolved.body.data.resolvedBy.name).toBe(student.name);
    const saved = await Question.findById(question._id);
    expect(saved?.resolvedAt).toBeInstanceOf(Date);
    const reopened = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(student))
      .send({ isResolved: false });
    expect(reopened.body.message).toBe('Question reopened');
    const after = await Question.findById(question._id);
    expect(after?.isResolved).toBe(false);
    expect(after?.resolvedBy).toBeUndefined();
    expect(after?.resolvedAt).toBeUndefined();
  });

  it.each(ADMINS)('%s resolves any question', async (role) => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(await createUser(role)))
      .send({ isResolved: true });
    expect(res.status).toBe(200);
  });

  it('the assigned teacher resolves; another teacher gets 403', async () => {
    const { user, course } = await createTeacherWithCourse();
    const other = await createTeacherWithCourse();
    const question = await createQuestionDoc(course, await createUser('Student'));
    const denied = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(other.user))
      .send({ isResolved: true });
    expect(denied.status).toBe(403);
    const ok = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(user))
      .send({ isResolved: true });
    expect(ok.status).toBe(200);
  });

  it('403 for a student who is not the author; unchanged', async () => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(await createUser('Student')))
      .send({ isResolved: true });
    expect(res.status).toBe(403);
    expect((await Question.findById(question._id))?.isResolved).toBe(false);
  });

  it.each([{}, { isResolved: 'true' }, { isResolved: 1 }])('400 for body %j', async (payload) => {
    const student = await createUser('Student');
    const question = await createQuestionDoc(await createCourse(), student);
    const res = await request(app)
      .patch(`/api/qa/questions/${question._id}/resolve`)
      .set('Cookie', authCookie(student))
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .patch(`/api/qa/questions/${missingId()}/resolve`)
          .set('Cookie', authCookie(student))
          .send({ isResolved: true })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/qa/questions/not-an-id/resolve')
          .set('Cookie', authCookie(student))
          .send({ isResolved: true })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/qa/questions/${missingId()}/resolve`)
          .send({ isResolved: true })
      ).status,
    ).toBe(401);
  });
});

describe('PATCH /api/qa/questions/:id/upvote', () => {
  it('toggles the upvote of the caller only', async () => {
    const course = await createCourse();
    const a = await createUser('Student');
    const b = await createUser('Student');
    await enrol(a, course);
    await enrol(b, course);
    const question = await createQuestionDoc(course, a);
    const up = await request(app)
      .patch(`/api/qa/questions/${question._id}/upvote`)
      .set('Cookie', authCookie(a));
    expect(up.status).toBe(200);
    expect(up.body.data.upvotes).toEqual([String(a._id)]);
    const both = await request(app)
      .patch(`/api/qa/questions/${question._id}/upvote`)
      .set('Cookie', authCookie(b));
    expect(both.body.data.upvotes).toEqual([String(a._id), String(b._id)]);
    const down = await request(app)
      .patch(`/api/qa/questions/${question._id}/upvote`)
      .set('Cookie', authCookie(a));
    expect(down.body.data.upvotes).toEqual([String(b._id)]);
    expect((await Question.findById(question._id))?.upvotes.map(String)).toEqual([String(b._id)]);
  });

  it('403 for a student who is not enrolled in the course; no vote stored', async () => {
    const question = await createQuestionDoc(await createCourse(), await createUser('Student'));
    const res = await request(app)
      .patch(`/api/qa/questions/${question._id}/upvote`)
      .set('Cookie', authCookie(await createUser('Student')));
    expect(res.status).toBe(403);
    expect((await Question.findById(question._id))?.upvotes).toHaveLength(0);
  });

  it('404 missing, 400 malformed, 401 no token', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .patch(`/api/qa/questions/${missingId()}/upvote`)
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/qa/questions/not-an-id/upvote')
          .set('Cookie', authCookie(student))
      ).status,
    ).toBe(400);
    expect((await request(app).patch(`/api/qa/questions/${missingId()}/upvote`)).status).toBe(401);
  });
});

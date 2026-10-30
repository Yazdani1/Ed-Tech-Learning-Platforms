import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { QuizAttempt } from '../../src/models/QuizAttempt.model';
import { QuizBank } from '../../src/models/QuizBank.model';
import { QuizSection } from '../../src/models/QuizSection.model';
import { authCookie, bearer, createCourse, createUser, enrol, missingId } from '../factories';
import {
  createQuizBankDoc,
  createQuizSectionDoc,
  createTeacherWithCourse,
} from '../factories/quiz-subscription';

const BASE = '/api/quiz-sections';

describe('GET /api/quiz-sections/course/:courseId', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).get(`${BASE}/course/${course._id}`)).status).toBe(401);
  });

  it('staff, the course teacher and enrolled students get all sections, ordered, with creator (Bearer too)', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const other = await createCourse();
    await createQuizSectionDoc(course, { title: 'Second', order: 1 });
    await createQuizSectionDoc(course, { title: 'First', order: 0 });
    await createQuizSectionDoc(other, { title: 'Elsewhere' });
    const student = await createUser('Student');
    await enrol(student, course);
    const staff = await Promise.all(
      (['Super Admin', 'Admin', 'Moderator'] as const).map((role) => createUser(role)),
    );
    for (const user of [...staff, teacher, student]) {
      const res = await request(app)
        .get(`${BASE}/course/${course._id}`)
        .set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data.map((s: { title: string }) => s.title)).toEqual(['First', 'Second']);
      expect(res.body.data[0].createdBy).toHaveProperty('name');
      expect(res.body.data[0].createdBy).not.toHaveProperty('password');
    }
    const viaBearer = await request(app)
      .get(`${BASE}/course/${course._id}`)
      .set('Authorization', bearer(student));
    expect(viaBearer.status).toBe(200);
  });

  it('SECURITY: without course access only free-preview sections of a Published + Public course are listed', async () => {
    const course = await createCourse();
    await createQuizSectionDoc(course, { title: 'Locked', order: 0 });
    await createQuizSectionDoc(course, { title: 'Free', order: 1, isFreePreview: true });
    const outsiders = [await createUser('Student'), (await createTeacherWithCourse()).user];
    for (const user of outsiders) {
      const res = await request(app)
        .get(`${BASE}/course/${course._id}`)
        .set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body.data.map((s: { title: string }) => s.title)).toEqual(['Free']);
    }
  });

  it('SECURITY: 403 without course access when there is no free-preview section or the course is not public', async () => {
    const cookie = authCookie(await createUser('Student'));
    const lockedOnly = await createCourse();
    await createQuizSectionDoc(lockedOnly, { title: 'Locked' });
    for (const overrides of [{ status: 'Draft' as const }, { visibility: 'Private' as const }]) {
      const hidden = await createCourse(overrides);
      await createQuizSectionDoc(hidden, { title: 'Free', isFreePreview: true });
      const res = await request(app).get(`${BASE}/course/${hidden._id}`).set('Cookie', cookie);
      expect(res.status).toBe(403);
    }
    const res = await request(app).get(`${BASE}/course/${lockedOnly._id}`).set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('400 for a malformed course id; 404 for an unknown course', async () => {
    const user = await createUser('Student');
    expect(
      (await request(app).get(`${BASE}/course/not-an-id`).set('Cookie', authCookie(user))).status,
    ).toBe(400);
    const res = await request(app)
      .get(`${BASE}/course/${missingId()}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/quiz-sections', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    expect((await request(app).post(BASE).send({ course: course._id, title: 'x' })).status).toBe(
      401,
    );
  });

  it('staff create a section: 201, trimmed title, order = number of existing sections, saved in DB', async () => {
    const course = await createCourse();
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const user = await createUser(role);
      const before = await QuizSection.countDocuments({ course: course._id });
      const res = await request(app)
        .post(BASE)
        .set('Cookie', authCookie(user))
        .send({ course: String(course._id), title: `  Intro ${role} ` });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(`Intro ${role}`);
      expect(res.body.data.order).toBe(before);
      expect(res.body.data.isFreePreview).toBe(false);
      expect(res.body.data.createdBy.name).toBe(user.name);
      const saved = await QuizSection.findById(res.body.data._id);
      expect(String(saved?.createdBy)).toBe(String(user._id));
    }
  });

  it('the teacher of the course can create (isFreePreview kept)', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(user))
      .send({ course: String(course._id), title: 'Mine', isFreePreview: true });
    expect(res.status).toBe(201);
    expect(res.body.data.isFreePreview).toBe(true);
  });

  it('403 for students, a teacher of another course and a teacher without a profile', async () => {
    const course = await createCourse();
    const student = await createUser('Student');
    const otherTeacher = await createTeacherWithCourse();
    const noProfile = await createUser('Teacher');
    for (const user of [student, otherTeacher.user, noProfile]) {
      const res = await request(app)
        .post(BASE)
        .set('Cookie', authCookie(user))
        .send({ course: String(course._id), title: 'x' });
      expect(res.status).toBe(403);
    }
    expect(await QuizSection.countDocuments({ course: course._id })).toBe(0);
  });

  it('400 when course or title is missing or blank', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const cookie = authCookie(admin);
    expect((await request(app).post(BASE).set('Cookie', cookie).send({ title: 'x' })).status).toBe(
      400,
    );
    expect(
      (
        await request(app)
          .post(BASE)
          .set('Cookie', cookie)
          .send({ course: String(course._id) })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post(BASE)
          .set('Cookie', cookie)
          .send({ course: String(course._id), title: '   ' })
      ).status,
    ).toBe(400);
  });

  it('400 for a malformed course id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ course: 'bad-id', title: 'x' });
    expect(res.status).toBe(400);
  });

  it('404 when the course does not exist', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ course: missingId(), title: 'x' });
    expect(res.status).toBe(404);
  });

  it('rejects an operator object as course (not a 500)', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ course: { $ne: null }, title: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/quiz-sections/:id', () => {
  it('401 without a token', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course);
    expect((await request(app).put(`${BASE}/${section._id}`).send({ title: 'x' })).status).toBe(
      401,
    );
  });

  it('staff and the course teacher update title and isFreePreview', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const admin = await createUser('Admin');
    const section = await createQuizSectionDoc(course, { title: 'Old' });
    const first = await request(app)
      .put(`${BASE}/${section._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: '  New  ', isFreePreview: true });
    expect(first.status).toBe(200);
    expect(first.body.data.title).toBe('New');
    expect(first.body.data.isFreePreview).toBe(true);
    const second = await request(app)
      .put(`${BASE}/${section._id}`)
      .set('Cookie', authCookie(teacher))
      .send({ isFreePreview: false });
    expect(second.status).toBe(200);
    const saved = await QuizSection.findById(section._id);
    expect(saved?.title).toBe('New');
    expect(saved?.isFreePreview).toBe(false);
  });

  it('403 for students and other teachers; title unchanged', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course, { title: 'Keep' });
    const student = await createUser('Student');
    const other = await createTeacherWithCourse();
    for (const user of [student, other.user]) {
      const res = await request(app)
        .put(`${BASE}/${section._id}`)
        .set('Cookie', authCookie(user))
        .send({ title: 'Hacked' });
      expect(res.status).toBe(403);
    }
    expect((await QuizSection.findById(section._id))?.title).toBe('Keep');
  });

  it('404 for a missing id, 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect(
      (await request(app).put(`${BASE}/${missingId()}`).set('Cookie', cookie).send({})).status,
    ).toBe(404);
    expect((await request(app).put(`${BASE}/nope`).set('Cookie', cookie).send({})).status).toBe(
      400,
    );
  });

  it('400 when the title is set to a blank value', async () => {
    const admin = await createUser('Admin');
    const section = await createQuizSectionDoc(await createCourse());
    const res = await request(app)
      .put(`${BASE}/${section._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/quiz-sections/:id', () => {
  it('401 without a token', async () => {
    const section = await createQuizSectionDoc(await createCourse());
    expect((await request(app).delete(`${BASE}/${section._id}`)).status).toBe(401);
  });

  it('deletes the section, its banks and their attempts, but keeps other banks', async () => {
    const course = await createCourse();
    const section = await createQuizSectionDoc(course);
    const bank = await createQuizBankDoc(course, { quizSection: section._id });
    const otherBank = await createQuizBankDoc(course);
    const student = await createUser('Student');
    await enrol(student, course);
    await QuizAttempt.create({ student: student._id, quizBank: bank._id, course: course._id });
    await QuizAttempt.create({
      student: student._id,
      quizBank: otherBank._id,
      course: course._id,
    });
    const mod = await createUser('Moderator');
    const res = await request(app).delete(`${BASE}/${section._id}`).set('Cookie', authCookie(mod));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Quiz section deleted');
    expect(await QuizSection.findById(section._id)).toBeNull();
    expect(await QuizBank.findById(bank._id)).toBeNull();
    expect(await QuizAttempt.countDocuments({ quizBank: bank._id })).toBe(0);
    expect(await QuizBank.findById(otherBank._id)).not.toBeNull();
    expect(await QuizAttempt.countDocuments({ quizBank: otherBank._id })).toBe(1);
  });

  it('the course teacher can delete; students, other teachers and profile-less teachers get 403', async () => {
    const { user: teacher, course } = await createTeacherWithCourse();
    const section = await createQuizSectionDoc(course);
    const student = await createUser('Student');
    const other = await createTeacherWithCourse();
    const noProfile = await createUser('Teacher');
    for (const user of [student, other.user, noProfile]) {
      expect(
        (await request(app).delete(`${BASE}/${section._id}`).set('Cookie', authCookie(user)))
          .status,
      ).toBe(403);
    }
    expect(await QuizSection.findById(section._id)).not.toBeNull();
    const ok = await request(app)
      .delete(`${BASE}/${section._id}`)
      .set('Cookie', authCookie(teacher));
    expect(ok.status).toBe(200);
  });

  it('404 for a missing id, 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect((await request(app).delete(`${BASE}/${missingId()}`).set('Cookie', cookie)).status).toBe(
      404,
    );
    expect((await request(app).delete(`${BASE}/nope`).set('Cookie', cookie)).status).toBe(400);
  });
});

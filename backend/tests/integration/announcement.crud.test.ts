import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { Course } from '../../src/models/Course.model';
import { Enrollment } from '../../src/models/Enrollment.model';
import { User } from '../../src/models/User.model';
import {
  authCookie,
  bearer,
  createCourse,
  createUser,
  createUsersForAllRoles,
  enrol,
  missingId,
} from '../factories';
import { createAnnouncement, createTeacherWithCourse } from '../factories/learning';

import type { UserRole } from '../../src/types/index';

const POSTERS: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];
const ADMINS: UserRole[] = ['Super Admin', 'Admin', 'Moderator'];
const body = { title: '  Exam date  ', description: '  Friday  ' };

describe('GET /api/announcements/course/:courseId', () => {
  it('lists the course announcements newest first with the poster, for an enrolled student', async () => {
    const { user, course } = await createTeacherWithCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const first = await createAnnouncement(course, user);
    await createAnnouncement(await createCourse(), user);
    const second = await createAnnouncement(course, user);
    const res = await request(app)
      .get(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((a: { _id: string }) => a._id)).toEqual([
      String(second._id),
      String(first._id),
    ]);
    expect(res.body.data[0].postedBy).toMatchObject({ name: user.name, role: 'Teacher' });
    expect(res.body.data[0].postedBy.email).toBeUndefined();
    expect(res.body.data[0].postedBy.password).toBeUndefined();
  });

  it('works with the Bearer header', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .get('/api/announcements/course/' + String(course._id))
      .set('Authorization', bearer(user));
    expect(res.status).toBe(200);
  });

  it('403 for a student who is not enrolled (course content)', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createAnnouncement(course, user);
    const outsider = await createUser('Student');
    const res = await request(app)
      .get(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(outsider));
    expect(res.status).toBe(403);
  });

  it('403 for a teacher of another course; 200 for staff', async () => {
    const { user, course } = await createTeacherWithCourse();
    await createAnnouncement(course, user);
    const other = await createTeacherWithCourse();
    const denied = await request(app)
      .get(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(other.user));
    expect(denied.status).toBe(403);
    for (const role of ADMINS) {
      const res = await request(app)
        .get(`/api/announcements/course/${course._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(200);
    }
  });

  it('404 for an unknown course', async () => {
    const res = await request(app)
      .get(`/api/announcements/course/${missingId()}`)
      .set('Cookie', authCookie(await createUser('Admin')));
    expect(res.status).toBe(404);
  });

  it('400 for a malformed course id', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .get('/api/announcements/course/not-an-id')
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).get(`/api/announcements/course/${missingId()}`)).status).toBe(401);
  });
});

describe('POST /api/announcements/course/:courseId', () => {
  it.each(ADMINS)('%s posts to any course; text is trimmed and stored', async (role) => {
    const poster = await createUser(role);
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(poster))
      .send(body);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Announcement posted');
    expect(res.body.data).toMatchObject({ title: 'Exam date', description: 'Friday' });
    expect(res.body.data.postedBy.name).toBe(poster.name);
    const saved = await Announcement.findOne({ course: course._id });
    expect(String(saved?.postedBy)).toBe(String(poster._id));
  });

  it('the assigned teacher posts', async () => {
    const { user, course } = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(201);
  });

  it('403 for a teacher of another course, nothing saved', async () => {
    const { user } = await createTeacherWithCourse();
    const foreign = await createTeacherWithCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${foreign.course._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(403);
    expect(await Announcement.countDocuments({ course: foreign.course._id })).toBe(0);
  });

  it('403 for a teacher without a profile', async () => {
    const teacher = await createUser('Teacher');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(teacher))
      .send(body);
    expect(res.status).toBe(403);
  });

  it.each([
    ['missing title', { description: 'x' }],
    ['blank title', { title: '   ', description: 'x' }],
    ['missing description', { title: 'x' }],
    ['blank description', { title: 'x', description: ' ' }],
  ])('400 for %s', async (_name, payload) => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send(payload);
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when the title is an object', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(admin))
      .send({ title: { $gt: '' }, description: 'x' });
    expect(res.status).toBe(400);
  });

  it('404 for a missing course', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(`/api/announcements/course/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send(body);
    expect(res.status).toBe(404);
  });

  it('400 for a malformed course id', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/announcements/course/not-an-id')
      .set('Cookie', authCookie(admin))
      .send(body);
    expect(res.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect(
      (await request(app).post(`/api/announcements/course/${missingId()}`).send(body)).status,
    ).toBe(401);
  });

  it('403 for Student', async () => {
    const users = await createUsersForAllRoles();
    const course = await createCourse();
    await enrol(users.Student, course);
    const res = await request(app)
      .post(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(users.Student))
      .send(body);
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/announcements/:id', () => {
  it('the owner updates it; text is trimmed', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const res = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Announcement updated');
    expect(res.body.data).toMatchObject({ title: 'Exam date', description: 'Friday' });
    expect((await Announcement.findById(item._id))?.title).toBe('Exam date');
  });

  it.each(ADMINS)('%s updates anyone announcement', async (role) => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const res = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(await createUser(role)))
      .send(body);
    expect(res.status).toBe(200);
  });

  it('403 for another teacher; unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const other = await createUser('Teacher');
    const res = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(other))
      .send(body);
    expect(res.status).toBe(403);
    expect((await Announcement.findById(item._id))?.title).toBe(item.title);
  });

  it('403 for a student', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const res = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(await createUser('Student')))
      .send(body);
    expect(res.status).toBe(403);
  });

  it('400 for a blank title or description', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const noTitle = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user))
      .send({ title: '', description: 'x' });
    const noDesc = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user))
      .send({ title: 'x' });
    expect(noTitle.status).toBe(400);
    expect(noDesc.status).toBe(400);
  });

  it('404 for a missing id and 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const missing = await request(app)
      .put(`/api/announcements/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send(body);
    const bad = await request(app)
      .put('/api/announcements/not-an-id')
      .set('Cookie', authCookie(admin))
      .send(body);
    expect(missing.status).toBe(404);
    expect(bad.status).toBe(400);
  });

  it('401 without a token', async () => {
    expect((await request(app).put(`/api/announcements/${missingId()}`).send(body)).status).toBe(
      401,
    );
  });
});

describe('DELETE /api/announcements/:id', () => {
  it('the owner deletes it', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    const res = await request(app)
      .delete(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Announcement deleted' });
    expect(await Announcement.findById(item._id)).toBeNull();
  });

  it.each(POSTERS.filter((r) => r !== 'Teacher'))(
    '%s deletes anyone announcement',
    async (role) => {
      const { user, course } = await createTeacherWithCourse();
      const item = await createAnnouncement(course, user);
      const res = await request(app)
        .delete(`/api/announcements/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(200);
    },
  );

  it('403 for another teacher and for a student; kept', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .delete(`/api/announcements/${item._id}`)
        .set('Cookie', authCookie(await createUser(role)));
      expect(res.status).toBe(403);
    }
    expect(await Announcement.findById(item._id)).not.toBeNull();
  });

  it('404 for a missing id, 400 for a malformed id, 401 without token', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .delete(`/api/announcements/${missingId()}`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete('/api/announcements/not-an-id').set('Cookie', authCookie(admin)))
        .status,
    ).toBe(400);
    expect((await request(app).delete(`/api/announcements/${missingId()}`)).status).toBe(401);
  });
});

describe('PUT/DELETE /api/announcements/:id by an author no longer teaching the course', () => {
  it('SECURITY: 403 on update and delete once the teacher is removed from the course; item unchanged', async () => {
    const { user, course } = await createTeacherWithCourse();
    const item = await createAnnouncement(course, user);
    await Course.updateOne({ _id: course._id }, { $set: { teachers: [] } });
    const put = await request(app)
      .put(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user))
      .send(body);
    expect(put.status).toBe(403);
    expect(put.body.message).toBe('You are no longer a teacher of this course');
    const del = await request(app)
      .delete(`/api/announcements/${item._id}`)
      .set('Cookie', authCookie(user));
    expect(del.status).toBe(403);
    const saved = await Announcement.findById(item._id);
    expect(saved).not.toBeNull();
    expect(saved?.title).toBe(item.title);
  });
});

describe('course content access through a subscription enrolment', () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const setup = async (
    plan: string,
    endDate: Date,
    courseOverrides: Parameters<typeof createCourse>[0] = {},
  ) => {
    const course = await createCourse({ includedInSubscription: true, ...courseOverrides });
    await createAnnouncement(course, await createUser('Admin'));
    const student = await createUser('Student');
    await User.updateOne(
      { _id: student._id },
      { $set: { activeSubscription: { plan, startDate: new Date(Date.now() - DAY_MS), endDate } } },
    );
    await Enrollment.create({
      student: student._id,
      course: course._id,
      enrollmentType: 'subscription',
    });
    return request(app)
      .get(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(student));
  };
  const future = () => new Date(Date.now() + DAY_MS);

  it('an active plan that includes the course gives access', async () => {
    expect((await setup('Gold', future())).status).toBe(200);
    expect((await setup('Gold', future(), { allowedSubscriptionPlans: ['Gold'] })).status).toBe(
      200,
    );
  });

  it('SECURITY: 403 once the plan has expired', async () => {
    expect((await setup('Gold', new Date(Date.now() - DAY_MS))).status).toBe(403);
  });

  it('SECURITY: 403 when the course is no longer included in subscriptions or not in the plan', async () => {
    expect((await setup('Gold', future(), { includedInSubscription: false })).status).toBe(403);
    expect((await setup('Gold', future(), { allowedSubscriptionPlans: ['Platinum'] })).status).toBe(
      403,
    );
  });

  it('free and paid enrolments are not affected by the subscription state', async () => {
    const course = await createCourse();
    await createAnnouncement(course, await createUser('Admin'));
    const student = await createUser('Student');
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid' });
    const res = await request(app)
      .get(`/api/announcements/course/${course._id}`)
      .set('Cookie', authCookie(student));
    expect(res.status).toBe(200);
  });
});

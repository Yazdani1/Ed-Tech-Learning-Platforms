import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Announcement } from '../../src/models/Announcement.model';
import { AnnouncementBroadcast } from '../../src/models/AnnouncementBroadcast.model';
import { AuditLog } from '../../src/models/AuditLog.model';
import {
  PNG_BYTES,
  authCookie,
  bearer,
  createCourse,
  createUser,
  enrol,
  missingId,
} from '../factories';
import { mockCloudinary } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';

const BASE = '/api/announcements/broadcasts';
const as = (user: IUser) => ({ Cookie: authCookie(user) });

beforeEach(async () => {
  await Promise.all([
    AnnouncementBroadcast.deleteMany({}),
    Announcement.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const sendBroadcast = async (admin: IUser, courses: { _id: unknown }[]) => {
  const res = await request(app)
    .post(BASE)
    .set(as(admin))
    .field('title', 'Class moved')
    .field('description', '<p>Tomorrow at 9</p>')
    .field('courseIds', JSON.stringify(courses.map((course) => String(course._id))));
  return String(res.body.data._id);
};

describe('PUT /api/announcements/broadcasts/:id', () => {
  it('changes the text in every course and keeps the old text in the history', async () => {
    const admin = await createUser('Admin');
    const [a, b] = [await createCourse(), await createCourse()];
    const id = await sendBroadcast(admin, [a, b]);
    const res = await request(app)
      .put(`${BASE}/${id}`)
      .set(as(admin))
      .field('title', ' Class at 10 ');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'Class at 10',
      description: '<p>Tomorrow at 9</p>',
    });
    expect(res.body.data.editedAt).toBeTruthy();
    const perCourse = await Announcement.find({ broadcast: id }).lean();
    expect(perCourse.map((item) => item.title)).toEqual(['Class at 10', 'Class at 10']);

    const history = await request(app).get(`${BASE}/${id}/history`).set(as(admin));
    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0]).toMatchObject({
      action: 'announcement.update',
      before: { title: 'Class moved', description: '<p>Tomorrow at 9</p>' },
      after: { title: 'Class at 10' },
      actor: { name: admin.name },
    });
  });

  it('replaces and removes the picture', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Super Admin');
    const id = await sendBroadcast(admin, [await createCourse()]);
    const added = await request(app)
      .put(`${BASE}/${id}`)
      .set(as(admin))
      .attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(added.status).toBe(200);
    expect(added.body.data.image.url).toContain('res.cloudinary.com');
    expect(JSON.stringify(added.body)).not.toContain('publicId');
    expect((await Announcement.findOne({ broadcast: id }).lean())?.image?.url).toBe(
      added.body.data.image.url,
    );
    const removed = await request(app)
      .put(`${BASE}/${id}`)
      .set(as(admin))
      .field('removeImage', 'true');
    expect(removed.status).toBe(200);
    expect(removed.body.data.image).toBeUndefined();
    expect(cloud.destroy).toHaveBeenCalledTimes(1);
  });

  it('400 for an empty title, nothing changed or a bad id; 404 for unknown or archived', async () => {
    const admin = await createUser('Admin');
    const id = await sendBroadcast(admin, [await createCourse()]);
    expect(
      (await request(app).put(`${BASE}/${id}`).set(as(admin)).field('title', '  ')).status,
    ).toBe(400);
    expect(
      (await request(app).put(`${BASE}/${id}`).set(as(admin)).field('title', 'Class moved')).status,
    ).toBe(400);
    expect((await request(app).put(`${BASE}/bad`).set(as(admin)).field('title', 'x')).status).toBe(
      400,
    );
    expect(
      (await request(app).put(`${BASE}/${missingId()}`).set(as(admin)).field('title', 'x')).status,
    ).toBe(404);
    await request(app).delete(`${BASE}/${id}`).set(as(admin));
    expect(
      (await request(app).put(`${BASE}/${id}`).set(as(admin)).field('title', 'x')).status,
    ).toBe(404);
  });

  it('401 without a token, Bearer accepted, 403 for teachers and students', async () => {
    const admin = await createUser('Admin');
    const id = await sendBroadcast(admin, [await createCourse()]);
    expect((await request(app).put(`${BASE}/${id}`).field('title', 'x')).status).toBe(401);
    for (const role of ['Teacher', 'Student'] as const) {
      expect(
        (
          await request(app)
            .put(`${BASE}/${id}`)
            .set(as(await createUser(role)))
            .field('title', 'x')
        ).status,
      ).toBe(403);
    }
    const moderator = await createUser('Moderator');
    const res = await request(app)
      .put(`${BASE}/${id}`)
      .set('Authorization', bearer(moderator))
      .field('title', 'New');
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/announcements/broadcasts/:id (archive)', () => {
  it('hides it from the list, details and the course, but keeps it in the database', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse();
    const student = await createUser('Student');
    await enrol(student, course);
    const id = await sendBroadcast(admin, [course]);

    const res = await request(app).delete(`${BASE}/${id}`).set(as(admin));
    expect(res.status).toBe(200);
    expect((await request(app).get(BASE).set(as(admin))).body.total).toBe(0);
    expect((await request(app).get(`${BASE}/${id}`).set(as(admin))).status).toBe(404);
    const forStudent = await request(app)
      .get(`/api/announcements/course/${String(course._id)}`)
      .set(as(student));
    expect(forStudent.body.total).toBe(0);
    const forAdmin = await request(app)
      .get(`/api/announcements/course/${String(course._id)}`)
      .set(as(admin));
    expect(forAdmin.body.total).toBe(0);

    const stored = await AnnouncementBroadcast.findById(id).lean();
    expect(stored).toMatchObject({ isArchived: true });
    expect(String(stored?.archivedBy)).toBe(String(admin._id));
    expect(await Announcement.countDocuments({ broadcast: id, isArchived: true })).toBe(1);
    expect(await AuditLog.countDocuments({ action: 'announcement.archive', entity: id })).toBe(1);
  });

  it('an archived announcement can no longer be changed through its course', async () => {
    const admin = await createUser('Admin');
    const id = await sendBroadcast(admin, [await createCourse()]);
    await request(app).delete(`${BASE}/${id}`).set(as(admin));
    const perCourse = await Announcement.findOne({ broadcast: id }).lean();
    const res = await request(app)
      .put(`/api/announcements/${String(perCourse?._id)}`)
      .set(as(admin))
      .send({ title: 'Back again' });
    expect(res.status).toBe(404);
  });

  it('404 the second time, for unknown ids; 401; 403', async () => {
    const admin = await createUser('Admin');
    const id = await sendBroadcast(admin, [await createCourse()]);
    expect((await request(app).delete(`${BASE}/${id}`)).status).toBe(401);
    expect(
      (
        await request(app)
          .delete(`${BASE}/${id}`)
          .set(as(await createUser('Teacher')))
      ).status,
    ).toBe(403);
    expect((await request(app).delete(`${BASE}/${id}`).set(as(admin))).status).toBe(200);
    expect((await request(app).delete(`${BASE}/${id}`).set(as(admin))).status).toBe(404);
    expect((await request(app).delete(`${BASE}/${missingId()}`).set(as(admin))).status).toBe(404);
    expect((await request(app).get(`${BASE}/${id}/history`).set(as(admin))).status).toBe(404);
  });
});

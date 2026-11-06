import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { authCookie, createCourse, createUser, enrol, missingId } from '../factories';
import { NON_ADMIN_ROLES } from '../factories/catalog';

const setStatus = (admin: Awaited<ReturnType<typeof createUser>>, id: unknown, status: string) =>
  request(app)
    .patch(`/api/courses/${String(id)}/status`)
    .set('Cookie', authCookie(admin))
    .send({ status });

const remove = (user: Awaited<ReturnType<typeof createUser>>, id: unknown) =>
  request(app)
    .delete(`/api/courses/${String(id)}`)
    .set('Cookie', authCookie(user));

describe('PATCH /api/courses/:id/status: firstPublishedAt', () => {
  it('sets firstPublishedAt the first time a course is published and never changes it', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft' });
    expect((await Course.findById(course._id))?.firstPublishedAt).toBeUndefined();

    const published = await setStatus(admin, course._id, 'Published');
    expect(published.status).toBe(200);
    const first = (await Course.findById(course._id))?.firstPublishedAt;
    expect(first).toBeInstanceOf(Date);

    const unpublished = await setStatus(admin, course._id, 'Draft');
    expect(unpublished.status).toBe(200);
    const afterDraft = await Course.findById(course._id);
    expect(afterDraft?.firstPublishedAt?.getTime()).toBe(first?.getTime());
    expect(afterDraft?.publishedAt ?? null).toBeNull();

    await setStatus(admin, course._id, 'Published');
    expect((await Course.findById(course._id))?.firstPublishedAt?.getTime()).toBe(first?.getTime());
  });

  it('keeps a Draft course without firstPublishedAt when set to Draft again', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft' });
    await setStatus(admin, course._id, 'Draft');
    expect((await Course.findById(course._id))?.firstPublishedAt).toBeUndefined();
  });

  it('400 for an invalid status and 404 for an unknown course', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft' });
    expect((await setStatus(admin, course._id, 'Archived')).status).toBe(400);
    expect((await setStatus(admin, missingId(), 'Published')).status).toBe(404);
  });

  it('401 without a token and 403 for other roles', async () => {
    const course = await createCourse({ status: 'Draft' });
    const anonymous = await request(app)
      .patch(`/api/courses/${String(course._id)}/status`)
      .send({ status: 'Published' });
    expect(anonymous.status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const res = await setStatus(await createUser(role), course._id, 'Published');
      expect(res.status, role).toBe(403);
    }
    expect((await Course.findById(course._id))?.status).toBe('Draft');
  });
});

describe('DELETE /api/courses/:id: published courses are kept', () => {
  it('400 for a Published course', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Published' });
    const res = await remove(admin, course._id);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'A course that was ever published cannot be deleted; unpublish it instead',
    );
    expect(await Course.exists({ _id: course._id })).not.toBeNull();
  });

  it('400 for a Draft course that was published before (firstPublishedAt)', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft', firstPublishedAt: new Date() });
    const res = await remove(admin, course._id);
    expect(res.status).toBe(400);
    expect(await Course.exists({ _id: course._id })).not.toBeNull();
  });

  it('refuses a course published and unpublished through the API', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft' });
    await setStatus(admin, course._id, 'Published');
    await setStatus(admin, course._id, 'Draft');
    expect((await remove(admin, course._id)).status).toBe(400);
  });

  it.each(['Super Admin', 'Admin'] as const)(
    'lets %s delete a never-published Draft',
    async (role) => {
      const admin = await createUser(role);
      const course = await createCourse({ status: 'Draft' });
      const res = await remove(admin, course._id);
      expect(res.status).toBe(200);
      expect(await Course.exists({ _id: course._id })).toBeNull();
    },
  );

  it('still refuses a Draft with enrolments, and answers 404 / 401 / 403', async () => {
    const admin = await createUser('Admin');
    const course = await createCourse({ status: 'Draft' });
    await enrol(await createUser('Student'), course);
    expect((await remove(admin, course._id)).status).toBe(400);
    expect((await remove(admin, missingId())).status).toBe(404);
    expect((await request(app).delete(`/api/courses/${String(course._id)}`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      expect((await remove(await createUser(role), course._id)).status, role).toBe(403);
    }
  });
});

describe('GET /api/courses/:id: enrolled students keep an unpublished course', () => {
  it('shows a Draft or Private course to a student who is enrolled, but 404 to others', async () => {
    const student = await createUser('Student');
    const outsider = await createUser('Student');
    const draft = await createCourse({ status: 'Draft' });
    const hidden = await createCourse({ visibility: 'Private' });
    await enrol(student, draft);
    await enrol(student, hidden);

    for (const course of [draft, hidden]) {
      const ok = await request(app)
        .get(`/api/courses/${String(course._id)}`)
        .set('Cookie', authCookie(student));
      expect(ok.status).toBe(200);
      expect(ok.body.data.title).toBe(course.title);
      for (const viewer of [outsider, undefined]) {
        const req = request(app).get(`/api/courses/${String(course._id)}`);
        const res = viewer ? await req.set('Cookie', authCookie(viewer)) : await req;
        expect(res.status).toBe(404);
      }
    }
  });
});

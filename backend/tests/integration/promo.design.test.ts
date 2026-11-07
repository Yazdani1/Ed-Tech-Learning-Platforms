import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { AuditLog } from '../../src/models/AuditLog.model';
import { Course } from '../../src/models/Course.model';
import { Promo } from '../../src/models/Promo.model';
import { SiteSetting } from '../../src/models/SiteSetting.model';
import { PNG_BYTES, authCookie, createCourse, createUser, missingId } from '../factories';
import { ADMIN_ROLES, NON_ADMIN_ROLES } from '../factories/catalog';
import { createPaidCourse, createPromoDoc } from '../factories/commerce';
import { mockCloudinary } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';

const as = (user: IUser) => ({ Cookie: authCookie(user) });

beforeEach(async () => {
  await Promise.all([SiteSetting.deleteMany({}), Promo.deleteMany({}), AuditLog.deleteMany({})]);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const upload = (user: IUser, slot: string, bytes: Buffer = PNG_BYTES) =>
  request(app)
    .put(`/api/promos/design/${slot}`)
    .set(as(user))
    .attach('image', bytes, { filename: 'p.png', contentType: 'image/png' });

describe('Promo design pictures', () => {
  it('is empty for guests until a picture is saved', async () => {
    const res = await request(app).get('/api/promos/design');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ bannerImage: '', popupImage: '' });
  });

  it.each(ADMIN_ROLES)(
    'lets %s set, replace and remove the banner and pop-up pictures',
    async (role) => {
      const cloud = mockCloudinary();
      const admin = await createUser(role);
      const banner = await upload(admin, 'banner');
      expect(banner.status).toBe(200);
      expect(banner.body.data.bannerImage).toContain('res.cloudinary.com');
      expect((await upload(admin, 'popup')).body.data.popupImage).toContain('medhabee/promos');
      await upload(admin, 'banner');
      expect(cloud.destroy).toHaveBeenCalledTimes(1);
      const publicView = await request(app).get('/api/promos/design');
      expect(JSON.stringify(publicView.body)).not.toContain('publicId');
      const removed = await request(app).delete('/api/promos/design/banner').set(as(admin));
      expect(removed.status).toBe(200);
      expect(removed.body.data.bannerImage).toBe('');
      expect(removed.body.data.popupImage).not.toBe('');
    },
  );

  it('400 for an unknown slot, no file or a file that is not an image', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    expect((await upload(admin, 'footer')).status).toBe(400);
    expect((await request(app).put('/api/promos/design/banner').set(as(admin))).status).toBe(400);
    expect((await upload(admin, 'banner', Buffer.from('not an image at all'))).status).toBe(400);
    expect((await request(app).delete('/api/promos/design/side').set(as(admin))).status).toBe(400);
  });

  it('401 without a token and 403 for other roles', async () => {
    expect((await request(app).put('/api/promos/design/banner')).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      expect((await upload(user, 'banner')).status, role).toBe(403);
      expect(
        (await request(app).delete('/api/promos/design/banner').set(as(user))).status,
        role,
      ).toBe(403);
    }
  });
});

describe('GET /api/promos/:id/history', () => {
  it('records each switch on and off with who did it', async () => {
    const admin = await createUser('Admin');
    const promo = await createPromoDoc([await createPaidCourse()], {}, admin);
    const id = String(promo._id);
    await request(app).patch(`/api/promos/${id}`).set(as(admin)).send({ isActive: false });
    await request(app).patch(`/api/promos/${id}`).set(as(admin)).send({ title: 'Renamed' });
    await request(app).patch(`/api/promos/${id}`).set(as(admin)).send({ isActive: true });
    const res = await request(app).get(`/api/promos/${id}/history`).set(as(admin));
    expect(res.status).toBe(200);
    expect(
      res.body.data.map((row: { after: { isActive: boolean } }) => row.after.isActive),
    ).toEqual([true, false]);
    expect(res.body.data[0].actor).toMatchObject({ name: admin.name });
  });

  it('400 bad id, 404 unknown, 401, 403', async () => {
    const admin = await createUser('Admin');
    expect((await request(app).get('/api/promos/bad/history').set(as(admin))).status).toBe(400);
    expect(
      (await request(app).get(`/api/promos/${missingId()}/history`).set(as(admin))).status,
    ).toBe(404);
    expect((await request(app).get(`/api/promos/${missingId()}/history`)).status).toBe(401);
    const student = await createUser('Student');
    expect(
      (await request(app).get(`/api/promos/${missingId()}/history`).set(as(student))).status,
    ).toBe(403);
  });
});

describe('GET /api/courses/:id/status-history', () => {
  it('records unpublish and publish (also from the bulk edit) with who did it', async () => {
    const admin = await createUser('Super Admin');
    const course = await createCourse({ status: 'Published' });
    const id = String(course._id);
    await request(app).patch(`/api/courses/${id}/status`).set(as(admin)).send({ status: 'Draft' });
    await request(app)
      .patch('/api/courses/bulk')
      .set(as(admin))
      .send({ courseIds: [id], updates: { status: 'Published' } });
    const res = await request(app).get(`/api/courses/${id}/status-history`).set(as(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.map((row: { action: string }) => row.action)).toEqual([
      'course.publish',
      'course.unpublish',
    ]);
    expect(res.body.data[0]).toMatchObject({ note: 'Bulk edit', before: { status: 'Draft' } });
    expect(res.body.data[1]).toMatchObject({
      before: { status: 'Published' },
      after: { status: 'Draft' },
    });
    expect(res.body.data[1].actor).toMatchObject({ name: admin.name });
    expect((await Course.findById(id).lean())?.status).toBe('Published');
  });

  it('404 for unknown or malformed ids; 401; 403', async () => {
    const admin = await createUser('Admin');
    expect(
      (await request(app).get(`/api/courses/${missingId()}/status-history`).set(as(admin))).status,
    ).toBe(404);
    expect((await request(app).get('/api/courses/bad/status-history').set(as(admin))).status).toBe(
      404,
    );
    expect((await request(app).get(`/api/courses/${missingId()}/status-history`)).status).toBe(401);
    for (const role of NON_ADMIN_ROLES) {
      const user = await createUser(role);
      expect(
        (await request(app).get(`/api/courses/${missingId()}/status-history`).set(as(user))).status,
      ).toBe(403);
    }
  });
});

import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { HomeHeroPost } from '../../src/models/HomeHeroPost.model';
import {
  authCookie,
  bearer,
  createUsersForAllRoles,
  missingId,
  PNG_BYTES,
  ROLES,
} from '../factories';
import { createHeroPost, daysAgo, daysFromNow } from '../factories/admin-messaging';
import { mockCloudinary, type CloudinaryMock } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/home-hero-posts';
const DENIED: UserRole[] = ['Moderator', 'Teacher', 'Student'];
const ALLOWED: UserRole[] = ['Super Admin', 'Admin'];
const MB = 1024 * 1024;
const OVER_LIMIT = 5 * MB + 1;

let users: Record<UserRole, IUser>;
let cloud: CloudinaryMock;

const as = (role: UserRole) => authCookie(users[role]);
const png = { filename: 'hero.png', contentType: 'image/png' };

beforeAll(async () => {
  users = await createUsersForAllRoles();
});

beforeEach(async () => {
  cloud = mockCloudinary();
  await HomeHeroPost.deleteMany({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/home-hero-posts (admin list)', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(BASE)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    expect((await request(app).get(BASE).set('Cookie', as(role))).status).toBe(403);
  });

  it.each(ALLOWED)(
    '%s sees Public and Private posts sorted by order, with the creator',
    async (role) => {
      const b = await createHeroPost(users.Admin, { order: 2, visibility: 'Private' });
      const a = await createHeroPost(users.Admin, { order: 1, visibility: 'Public' });
      const res = await request(app).get(BASE).set('Cookie', as(role));
      expect(res.status).toBe(200);
      expect(res.body.data.map((p: { _id: string }) => p._id)).toEqual([
        String(a._id),
        String(b._id),
      ]);
      expect(res.body.data[0].createdBy).toMatchObject({ name: users.Admin.name, role: 'Admin' });
      expect(res.body.data[0].createdBy).not.toHaveProperty('password');
      expect(res.body.data[0]).toHaveProperty('imagePublicId');
    },
  );

  it('applies due schedules before listing', async () => {
    const post = await createHeroPost(users.Admin, {
      visibility: 'Private',
      scheduledVisibility: 'Public',
      publishAt: daysAgo(1),
    });
    const res = await request(app).get(BASE).set('Cookie', as('Admin'));
    expect(res.body.data[0]).toMatchObject({ _id: String(post._id), visibility: 'Public' });
    expect(res.body.data[0].scheduledVisibility).toBeUndefined();
  });

  it('works with the Bearer header', async () => {
    const res = await request(app).get(BASE).set('Authorization', bearer(users.Admin));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/home-hero-posts (upload)', () => {
  it('401 without a token', async () => {
    const res = await request(app).post(BASE).attach('images', PNG_BYTES, png);
    expect(res.status).toBe(401);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it.each(DENIED)('403 for %s and nothing is uploaded', async (role) => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as(role))
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(403);
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(await HomeHeroPost.countDocuments()).toBe(0);
  });

  it.each(ALLOWED)('%s uploads one image (default Private) and it is saved', async (role) => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as(role))
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Hero post uploaded' });
    expect(res.body.data).toHaveLength(1);
    const post = res.body.data[0];
    expect(post).toMatchObject({
      visibility: 'Private',
      imageWidth: 1,
      imageHeight: 1,
      createdBy: String(users[role]._id),
    });
    expect(post.imageUrl).toMatch(
      /^https:\/\/res\.cloudinary\.com\/test-cloud\/medhabee\/home-hero\//,
    );
    expect(cloud.upload).toHaveBeenCalledTimes(1);
    expect(cloud.upload.mock.calls[0][0]).toMatchObject({ folder: 'medhabee/home-hero' });
    const saved = await HomeHeroPost.findById(post._id);
    expect(saved?.imagePublicId).toBe(post.imagePublicId);
  });

  it('accepts several images (images and image fields) with consecutive order values', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('visibility', 'Public')
      .field('order', '5')
      .attach('images', PNG_BYTES, png)
      .attach('images', PNG_BYTES, png)
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data.map((p: { order: number }) => p.order)).toEqual([5, 6, 7]);
    expect(res.body.data.every((p: { visibility: string }) => p.visibility === 'Public')).toBe(
      true,
    );
    expect(cloud.upload).toHaveBeenCalledTimes(3);
  });

  it('a future publishAt keeps it Private now and stores the wanted visibility as scheduled', async () => {
    const publishAt = daysFromNow(2).toISOString();
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('visibility', 'Public')
      .field('publishAt', publishAt)
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data[0]).toMatchObject({
      visibility: 'Private',
      scheduledVisibility: 'Public',
    });
    expect(new Date(res.body.data[0].publishAt).toISOString()).toBe(publishAt);
  });

  it('a new post goes after the existing ones when no order is sent', async () => {
    await createHeroPost(users.Admin, { order: 4 });
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data[0].order).toBe(5);
  });

  it('the first post gets order 0 when there are no posts yet', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data[0].order).toBe(0);
  });

  it('400 when no image is sent', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('visibility', 'Public');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('At least one image is required');
  });

  it('400 for a non-image file type', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('images', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only image files are allowed');
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 when a file that is not a real image claims to be image/png (magic bytes)', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('images', Buffer.from('<script>alert(1)</script>'), png);
    expect(res.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 (not 500) for an image above 5 MB', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('images', Buffer.alloc(OVER_LIMIT), png);
    expect(res.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 for an invalid publishAt and nothing is uploaded', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('publishAt', 'not a date')
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid publish date');
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 for a non-numeric order', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('order', 'abc')
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(400);
  });

  it('treats an unknown visibility value as Private', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('visibility', 'Everyone')
      .attach('images', PNG_BYTES, png);
    expect(res.body.data[0].visibility).toBe('Private');
  });
});

describe('PUT /api/home-hero-posts/:id', () => {
  const put = (id: string, role: UserRole = 'Admin') =>
    request(app).put(`${BASE}/${id}`).set('Cookie', as(role));

  it('401 without a token', async () => {
    expect((await request(app).put(`${BASE}/${missingId()}`).field('order', '1')).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const post = await createHeroPost(users.Admin);
    expect((await put(String(post._id), role).field('order', '9')).status).toBe(403);
    expect((await HomeHeroPost.findById(post._id))?.order).toBe(0);
  });

  it('changes visibility and order without touching the image', async () => {
    const post = await createHeroPost(users.Admin, { visibility: 'Public' });
    const res = await put(String(post._id)).field('visibility', 'Private').field('order', '7');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Hero post updated' });
    expect(res.body.data).toMatchObject({
      visibility: 'Private',
      order: 7,
      imageUrl: post.imageUrl,
    });
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(cloud.destroy).not.toHaveBeenCalled();
  });

  it('replaces the image: uploads the new one and deletes the old one from Cloudinary', async () => {
    const post = await createHeroPost(users.Admin, { imagePublicId: 'old/public-id' });
    const res = await put(String(post._id)).attach('image', PNG_BYTES, png);
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).not.toBe(post.imageUrl);
    expect(res.body.data.imagePublicId).not.toBe('old/public-id');
    expect(cloud.destroy).toHaveBeenCalledWith('old/public-id');
    expect((await HomeHeroPost.findById(post._id))?.imageUrl).toBe(res.body.data.imageUrl);
  });

  it('a future publishAt with a visibility schedules the change and keeps the current visibility', async () => {
    const post = await createHeroPost(users.Admin, { visibility: 'Private' });
    const res = await put(String(post._id))
      .field('visibility', 'Public')
      .field('publishAt', daysFromNow(3).toISOString());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ visibility: 'Private', scheduledVisibility: 'Public' });
    expect(res.body.data.publishAt).toBeTruthy();
  });

  it('a visibility without a future date applies at once and clears an old schedule', async () => {
    const post = await createHeroPost(users.Admin, {
      visibility: 'Private',
      scheduledVisibility: 'Private',
      publishAt: daysFromNow(3),
    });
    const res = await put(String(post._id)).field('visibility', 'Public');
    expect(res.body.data.visibility).toBe('Public');
    expect(res.body.data.scheduledVisibility).toBeUndefined();
    expect(res.body.data.publishAt).toBeUndefined();
  });

  it('404 for a missing post and 400 for a malformed id', async () => {
    expect((await put(missingId()).field('order', '1')).status).toBe(404);
    expect((await put('nope').field('order', '1')).status).toBe(400);
  });

  it('400 for an invalid publishAt', async () => {
    const post = await createHeroPost(users.Admin);
    const res = await put(String(post._id)).field('publishAt', 'garbage');
    expect(res.status).toBe(400);
  });

  it('400 for a non-image file and the old image is kept', async () => {
    const post = await createHeroPost(users.Admin);
    const res = await put(String(post._id)).attach('image', Buffer.from('x'), {
      filename: 'a.txt',
      contentType: 'text/plain',
    });
    expect(res.status).toBe(400);
    expect(cloud.destroy).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/home-hero-posts/reorder', () => {
  const patch = (body: object, role: UserRole = 'Admin') =>
    request(app).patch(`${BASE}/reorder`).set('Cookie', as(role)).send(body);

  it('401 without a token', async () => {
    expect(
      (
        await request(app)
          .patch(`${BASE}/reorder`)
          .send({ orderedIds: ['a'] })
      ).status,
    ).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    expect((await patch({ orderedIds: [missingId()] }, role)).status).toBe(403);
  });

  it('sets order to the position in orderedIds', async () => {
    const a = await createHeroPost(users.Admin, { order: 0 });
    const b = await createHeroPost(users.Admin, { order: 1 });
    const c = await createHeroPost(users.Admin, { order: 2 });
    const res = await patch({ orderedIds: [String(c._id), String(a._id), String(b._id)] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Hero posts reordered' });
    const orders = await Promise.all(
      [c, a, b].map(async (p) => (await HomeHeroPost.findById(p._id))?.order),
    );
    expect(orders).toEqual([0, 1, 2]);
    const list = await request(app).get(BASE).set('Cookie', as('Admin'));
    expect(list.body.data.map((p: { _id: string }) => p._id)).toEqual(
      [c, a, b].map((p) => String(p._id)),
    );
  });

  it('ignores ids that do not exist', async () => {
    const a = await createHeroPost(users.Admin, { order: 5 });
    const res = await patch({ orderedIds: [missingId(), String(a._id)] });
    expect(res.status).toBe(200);
    expect((await HomeHeroPost.findById(a._id))?.order).toBe(1);
  });

  it.each([
    ['missing', {}],
    ['empty', { orderedIds: [] }],
    ['not an array', { orderedIds: 'abc' }],
  ])('400 when orderedIds is %s', async (_name, body) => {
    const res = await patch(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('orderedIds is required');
  });

  it('400 for a malformed id', async () => {
    const res = await patch({ orderedIds: ['nope'] });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/home-hero-posts/:id', () => {
  const del = (id: string, role: UserRole = 'Admin') =>
    request(app).delete(`${BASE}/${id}`).set('Cookie', as(role));

  it('401 without a token', async () => {
    expect((await request(app).delete(`${BASE}/${missingId()}`)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s and the post stays', async (role) => {
    const post = await createHeroPost(users.Admin);
    expect((await del(String(post._id), role)).status).toBe(403);
    expect(await HomeHeroPost.exists({ _id: post._id })).toBeTruthy();
  });

  it.each(ALLOWED)('%s deletes the post and its Cloudinary image', async (role) => {
    const post = await createHeroPost(users.Admin, { imagePublicId: 'hero/to-delete' });
    const res = await del(String(post._id), role);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Hero post deleted' });
    expect(await HomeHeroPost.exists({ _id: post._id })).toBeNull();
    expect(cloud.destroy).toHaveBeenCalledWith('hero/to-delete');
  });

  it('404 for a missing post and 400 for a malformed id', async () => {
    expect((await del(missingId())).status).toBe(404);
    expect((await del('nope')).status).toBe(400);
    expect(cloud.destroy).not.toHaveBeenCalled();
  });
});

it('covers every role: only Super Admin and Admin pass the router guard', () => {
  expect(ROLES.filter((role) => !ALLOWED.includes(role))).toEqual(DENIED);
});

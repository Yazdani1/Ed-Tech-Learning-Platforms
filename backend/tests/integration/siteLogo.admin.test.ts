import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { SiteLogo } from '../../src/models/SiteLogo.model';
import { authCookie, bearer, createUsersForAllRoles, PNG_BYTES } from '../factories';
import { mockCloudinary, type CloudinaryMock } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const URL = '/api/home-hero-posts/logo';
const DENIED: UserRole[] = ['Moderator', 'Teacher', 'Student'];
const ALLOWED: UserRole[] = ['Super Admin', 'Admin'];
const png = { filename: 'logo.png', contentType: 'image/png' };

let users: Record<UserRole, IUser>;
let cloud: CloudinaryMock;

const as = (role: UserRole) => authCookie(users[role]);

beforeAll(async () => {
  users = await createUsersForAllRoles();
});

beforeEach(async () => {
  cloud = mockCloudinary();
  await SiteLogo.deleteMany({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/home-hero-posts/logo (admin)', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(URL)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    expect((await request(app).get(URL).set('Cookie', as(role))).status).toBe(403);
  });

  it('data null when there is no logo', async () => {
    const res = await request(app).get(URL).set('Cookie', as('Admin'));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
  });

  it.each(ALLOWED)('%s sees the logo with who updated it', async (role) => {
    await SiteLogo.create({
      imageUrl: 'https://x/logo.png',
      imagePublicId: 'logo/1',
      updatedBy: users.Admin._id,
    });
    const res = await request(app).get(URL).set('Cookie', as(role));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      imageUrl: 'https://x/logo.png',
      imagePublicId: 'logo/1',
      updatedBy: { name: users.Admin.name, role: 'Admin' },
    });
    expect(res.body.data.updatedBy).not.toHaveProperty('password');
  });

  it('works with the Bearer header', async () => {
    expect((await request(app).get(URL).set('Authorization', bearer(users.Admin))).status).toBe(
      200,
    );
  });
});

describe('PUT /api/home-hero-posts/logo', () => {
  it('401 without a token', async () => {
    const res = await request(app).put(URL).attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(401);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it.each(DENIED)('403 for %s and nothing is uploaded', async (role) => {
    const res = await request(app).put(URL).set('Cookie', as(role)).attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(403);
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(await SiteLogo.countDocuments()).toBe(0);
  });

  it.each(ALLOWED)('%s uploads the first logo (201)', async (role) => {
    const res = await request(app).put(URL).set('Cookie', as(role)).attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Logo uploaded' });
    expect(res.body.data).toMatchObject({
      imageWidth: 1,
      imageHeight: 1,
      updatedBy: String(users[role]._id),
    });
    expect(res.body.data.imageUrl).toMatch(/medhabee\/site-logo\//);
    expect(cloud.upload.mock.calls[0][0]).toMatchObject({ folder: 'medhabee/site-logo' });
    expect(cloud.destroy).not.toHaveBeenCalled();
    expect(await SiteLogo.countDocuments()).toBe(1);
  });

  it('replaces the existing logo (200): same document, old image deleted, new url public', async () => {
    const first = await request(app)
      .put(URL)
      .set('Cookie', as('Admin'))
      .attach('logo', PNG_BYTES, png);
    const second = await request(app)
      .put(URL)
      .set('Cookie', as('Super Admin'))
      .attach('logo', PNG_BYTES, png);
    expect(second.status).toBe(200);
    expect(second.body.message).toBe('Logo updated');
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(second.body.data.imageUrl).not.toBe(first.body.data.imageUrl);
    expect(second.body.data.updatedBy).toBe(String(users['Super Admin']._id));
    expect(cloud.destroy).toHaveBeenCalledWith(first.body.data.imagePublicId);
    expect(await SiteLogo.countDocuments()).toBe(1);
    const pub = await request(app).get('/api/home-hero-posts/logo/public');
    expect(pub.body.data.imageUrl).toBe(second.body.data.imageUrl);
  });

  it('400 when no file is sent', async () => {
    const res = await request(app).put(URL).set('Cookie', as('Admin'));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Logo image is required');
  });

  it('400 for a non-image file type', async () => {
    const res = await request(app)
      .put(URL)
      .set('Cookie', as('Admin'))
      .attach('logo', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 when the content is not a real image although the type says image/png (magic bytes)', async () => {
    const res = await request(app)
      .put(URL)
      .set('Cookie', as('Admin'))
      .attach('logo', Buffer.from('<svg onload=alert(1)>'), png);
    expect(res.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
  });
});

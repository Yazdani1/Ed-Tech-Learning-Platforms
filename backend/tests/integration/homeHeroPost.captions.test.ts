import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { HomeHeroPost } from '../../src/models/HomeHeroPost.model';
import { authCookie, createUsersForAllRoles, PNG_BYTES } from '../factories';
import { createHeroPost } from '../factories/admin-messaging';
import { mockCloudinary } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/home-hero-posts';
const png = { filename: 'hero.png', contentType: 'image/png' };
let users: Record<UserRole, IUser>;

beforeAll(async () => {
  users = await createUsersForAllRoles();
});
beforeEach(async () => {
  mockCloudinary();
  await HomeHeroPost.deleteMany({});
});
afterEach(() => {
  vi.restoreAllMocks();
});

const create = (fields: Record<string, string>) => {
  let req = request(app).post(BASE).set('Cookie', authCookie(users.Admin));
  for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
  return req.attach('images', PNG_BYTES, png);
};
const update = (id: unknown, fields: Record<string, string>) => {
  let req = request(app).put(`${BASE}/${id}`).set('Cookie', authCookie(users.Admin));
  for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
  return req;
};

describe('POST /api/home-hero-posts title and description', () => {
  it('saves trimmed title and description', async () => {
    const res = await create({ title: '  Learn fast  ', description: ' Short text ' });
    expect(res.status).toBe(201);
    const saved = await HomeHeroPost.findOne();
    expect(saved).toMatchObject({ title: 'Learn fast', description: 'Short text' });
  });

  it('works without them and stores nothing', async () => {
    const res = await create({});
    expect(res.status).toBe(201);
    const saved = await HomeHeroPost.findOne();
    expect(saved?.title).toBeUndefined();
    expect(saved?.description).toBeUndefined();
  });

  it('stores a blank title as nothing', async () => {
    expect((await create({ title: '   ' })).status).toBe(201);
    expect((await HomeHeroPost.findOne())?.title).toBeUndefined();
  });

  it('accepts exactly 120 / 300 characters', async () => {
    const res = await create({ title: 'a'.repeat(120), description: 'b'.repeat(300) });
    expect(res.status).toBe(201);
  });

  it('answers 400 for a title over 120 characters and creates nothing', async () => {
    const res = await create({ title: 'a'.repeat(121) });
    expect(res.status).toBe(400);
    expect(await HomeHeroPost.countDocuments()).toBe(0);
  });

  it('answers 400 for a description over 300 characters', async () => {
    const res = await create({ description: 'b'.repeat(301) });
    expect(res.status).toBe(400);
    expect(await HomeHeroPost.countDocuments()).toBe(0);
  });

  it('answers 400 when the title is sent twice (not text)', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(users.Admin))
      .field('title', 'one')
      .field('title', 'two')
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/home-hero-posts/:id title and description', () => {
  it('sets both', async () => {
    const post = await createHeroPost(users.Admin);
    const res = await update(post._id, { title: 'New title', description: 'New description' });
    expect(res.status).toBe(200);
    expect(await HomeHeroPost.findById(post._id)).toMatchObject({
      title: 'New title',
      description: 'New description',
    });
  });

  it('clears a value with an empty string', async () => {
    const post = await createHeroPost(users.Admin, { title: 'Old', description: 'Old text' });
    const res = await update(post._id, { title: '', description: '  ' });
    expect(res.status).toBe(200);
    const saved = await HomeHeroPost.findById(post._id);
    expect(saved?.title).toBeUndefined();
    expect(saved?.description).toBeUndefined();
  });

  it('keeps them when not sent', async () => {
    const post = await createHeroPost(users.Admin, { title: 'Keep', description: 'Keep text' });
    const res = await update(post._id, { order: '4' });
    expect(res.status).toBe(200);
    expect(await HomeHeroPost.findById(post._id)).toMatchObject({
      title: 'Keep',
      description: 'Keep text',
    });
  });

  it('answers 400 when too long and changes nothing', async () => {
    const post = await createHeroPost(users.Admin, { title: 'Keep' });
    expect((await update(post._id, { title: 'a'.repeat(121) })).status).toBe(400);
    expect((await update(post._id, { description: 'b'.repeat(301) })).status).toBe(400);
    expect((await HomeHeroPost.findById(post._id))?.title).toBe('Keep');
  });

  it.each(['Moderator', 'Teacher', 'Student'] as UserRole[])('answers 403 for %s', async (role) => {
    const post = await createHeroPost(users.Admin);
    const res = await request(app)
      .put(`${BASE}/${post._id}`)
      .set('Cookie', authCookie(users[role]))
      .field('title', 'x');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/home-hero-posts/public captions', () => {
  it('returns title and description', async () => {
    await createHeroPost(users.Admin, { title: 'Hello', description: 'World' });
    const res = await request(app).get(`${BASE}/public`);
    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ title: 'Hello', description: 'World' });
    expect(res.body.data[0]).not.toHaveProperty('imagePublicId');
  });
});

import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { CommunityBadge } from '../../src/models/CommunityBadge.model';
import { CommunityChannel } from '../../src/models/CommunityChannel.model';
import { CommunityPointRule } from '../../src/models/CommunityPointRule.model';
import { CommunitySetting } from '../../src/models/CommunitySetting.model';
import { PNG_BYTES, authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createCommunityBadge, createCommunityChannel } from '../factories/community';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => vi.restoreAllMocks());

const NON_ADMIN = ['Moderator', 'Teacher', 'Student'] as const;
const ADMINS = ['Super Admin', 'Admin'] as const;
const png = { filename: 'a.png', contentType: 'image/png' };

describe('role guards on the admin endpoints', () => {
  const endpoints: Array<[string, string]> = [
    ['get', '/api/community/settings'],
    ['put', '/api/community/settings'],
    ['get', '/api/community/admin/channels'],
    ['post', '/api/community/channels'],
    ['put', `/api/community/channels/${missingId()}`],
    ['patch', `/api/community/channels/${missingId()}/archive`],
    ['get', '/api/community/badges'],
    ['post', '/api/community/badges'],
    ['put', `/api/community/badges/${missingId()}`],
    ['patch', `/api/community/badges/${missingId()}/archive`],
    ['get', '/api/community/point-rules'],
    ['put', '/api/community/point-rules'],
  ];

  it('401 without a token and 403 for Moderator, Teacher and Student', async () => {
    const users = await createUsersForAllRoles();
    for (const [method, url] of endpoints) {
      const anon = await (request(app) as unknown as Record<string, (u: string) => request.Test>)[
        method
      ](url);
      expect(anon.status, `${method} ${url} anonymous`).toBe(401);
      for (const role of NON_ADMIN) {
        const agent = request(app) as unknown as Record<string, (u: string) => request.Test>;
        const res = await agent[method](url).set('Cookie', authCookie(users[role]));
        expect(res.status, `${method} ${url} ${role}`).toBe(403);
      }
    }
  });
});

describe('community settings', () => {
  it('GET creates and returns the default settings for Super Admin and Admin', async () => {
    for (const role of ADMINS) {
      const user = await createUser(role);
      const res = await request(app).get('/api/community/settings').set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Community Hub');
      expect(res.body.data.headerImagePublicId).toBeUndefined();
    }
    expect(await CommunitySetting.countDocuments()).toBe(1);
  });

  it('PUT updates title and description and stores updatedBy', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .put('/api/community/settings')
      .set('Cookie', authCookie(admin))
      .send({ title: 'New title', description: 'New description' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Community settings updated');
    expect(res.body.data).toMatchObject({ title: 'New title', description: 'New description' });
    const saved = await CommunitySetting.findOne().lean();
    expect(String(saved?.updatedBy)).toBe(String(admin._id));
  });

  it('PUT with an image uploads it, and replaces (deletes) the previous one', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Super Admin');
    const first = await request(app)
      .put('/api/community/settings')
      .set('Cookie', authCookie(admin))
      .attach('image', PNG_BYTES, png);
    expect(first.status).toBe(200);
    expect(first.body.data.headerImageUrl).toContain('community/settings');
    expect(cloud.destroy).not.toHaveBeenCalled();

    await request(app)
      .put('/api/community/settings')
      .set('Cookie', authCookie(admin))
      .attach('image', PNG_BYTES, png);
    expect(cloud.upload).toHaveBeenCalledTimes(2);
    expect(cloud.destroy).toHaveBeenCalledTimes(1);
  });

  it('PUT 400 for a non-image upload', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const res = await request(app)
      .put('/api/community/settings')
      .set('Cookie', authCookie(admin))
      .attach('image', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('community channels (admin)', () => {
  it('POST creates a channel with a slug (201) and rejects missing name and duplicates (400)', async () => {
    const admin = await createUser('Admin');
    const name = `Study Tips ${Date.now()}`;
    const res = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .send({ name, description: 'Hello' });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe(name.toLowerCase().replace(/\s+/g, '-'));
    expect(String(res.body.data.createdBy)).toBe(String(admin._id));
    expect(res.body.data.imagePublicId).toBeUndefined();

    const dup = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .send({ name });
    expect(dup.status).toBe(400);
    const blank = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .send({ name: '  ' });
    expect(blank.status).toBe(400);
    const none = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .send({});
    expect(none.status).toBe(400);
  });

  it('POST with an image stores the Cloudinary URL', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .field('name', `Img channel ${Date.now()}`)
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data.imageUrl).toContain('community/channels');
    const saved = await CommunityChannel.findById(res.body.data._id)
      .select('+imagePublicId')
      .lean();
    expect(saved?.imagePublicId).toBeTruthy();
  });

  it('POST answers 400 (not 500) when the name is not text', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/community/channels')
      .set('Cookie', authCookie(admin))
      .send({ name: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('PUT updates name (and slug) and description; replaces the image', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const channel = await createCommunityChannel({
      imagePublicId: 'old/image',
      imageUrl: 'https://x/old.png',
    });

    const res = await request(app)
      .put(`/api/community/channels/${channel._id}`)
      .set('Cookie', authCookie(admin))
      .field('name', 'Renamed Channel')
      .field('description', 'Updated')
      .attach('image', PNG_BYTES, png);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: 'Renamed Channel',
      slug: 'renamed-channel',
      description: 'Updated',
    });
    expect(cloud.destroy).toHaveBeenCalledWith('old/image');
    expect(res.body.data.imageUrl).toContain('community/channels');
    expect(res.body.data.imagePublicId).toBeUndefined();
  });

  it('PUT 404 for an unknown id, 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .put(`/api/community/channels/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send({ name: 'x' })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/community/channels/bad')
          .set('Cookie', authCookie(admin))
          .send({ name: 'x' })
      ).status,
    ).toBe(400);
  });

  it('PUT to a name whose slug already exists answers 400, not 500', async () => {
    const admin = await createUser('Admin');
    const a = await createCommunityChannel({ name: 'Taken Name', slug: 'taken-name' });
    const b = await createCommunityChannel();
    const res = await request(app)
      .put(`/api/community/channels/${b._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: a.name });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Channel already exists');
    expect((await CommunityChannel.findById(b._id).lean())?.name).toBe(b.name);

    const same = await request(app)
      .put(`/api/community/channels/${a._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: a.name, description: 'Kept name' });
    expect(same.status).toBe(200);
  });

  it('PUT answers 400 when name or description is not text', async () => {
    const admin = await createUser('Admin');
    const channel = await createCommunityChannel();
    for (const body of [{ name: { $gt: '' } }, { description: ['x'] }]) {
      const res = await request(app)
        .put(`/api/community/channels/${channel._id}`)
        .set('Cookie', authCookie(admin))
        .send(body);
      expect(res.status).toBe(400);
    }
  });

  it('PATCH archive hides the channel from the public list but not from the admin list', async () => {
    const admin = await createUser('Super Admin');
    const channel = await createCommunityChannel();
    const res = await request(app)
      .patch(`/api/community/channels/${channel._id}/archive`)
      .set('Cookie', authCookie(admin));

    expect(res.status).toBe(200);
    expect(res.body.data.isArchived).toBe(true);
    const saved = await CommunityChannel.findById(channel._id).lean();
    expect(saved?.isArchived).toBe(true);
    expect(String(saved?.archivedBy)).toBe(String(admin._id));
    expect(saved?.archivedAt).toBeTruthy();

    const pub = await request(app).get('/api/community');
    expect(pub.body.data.channels.map((c: { _id: string }) => c._id)).not.toContain(
      String(channel._id),
    );
    const list = await request(app)
      .get('/api/community/admin/channels')
      .set('Cookie', authCookie(admin));
    expect(list.status).toBe(200);
    const ids = list.body.data.map((c: { _id: string }) => c._id);
    expect(ids).toContain(String(channel._id));
  });

  it('GET admin/channels lists archived channels last, sorted by name', async () => {
    const admin = await createUser('Admin');
    await CommunityChannel.deleteMany({});
    await createCommunityChannel({ name: 'Zeta', slug: 'zeta' });
    await createCommunityChannel({ name: 'Alpha', slug: 'alpha', isArchived: true });
    await createCommunityChannel({ name: 'Beta', slug: 'beta' });
    const res = await request(app)
      .get('/api/community/admin/channels')
      .set('Cookie', authCookie(admin));
    expect(res.body.data.map((c: { name: string }) => c.name)).toEqual(['Beta', 'Zeta', 'Alpha']);
  });

  it('PATCH archive 404 / 400 for unknown or malformed id', async () => {
    const admin = await createUser('Admin');
    expect(
      (
        await request(app)
          .patch(`/api/community/channels/${missingId()}/archive`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/community/channels/bad/archive')
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(400);
  });
});

describe('community badges', () => {
  it('POST creates a badge (201) with an image', async () => {
    mockCloudinary();
    const admin = await createUser('Admin');
    const res = await request(app)
      .post('/api/community/badges')
      .set('Cookie', authCookie(admin))
      .field('name', 'Helper')
      .field('requiredPoints', '25')
      .attach('image', PNG_BYTES, png);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'Helper', requiredPoints: 25, isArchived: false });
    expect(res.body.data.imageUrl).toContain('community/badges');
    expect(res.body.data.imagePublicId).toBeUndefined();
    expect(String(res.body.data.createdBy)).toBe(String(admin._id));
  });

  it('POST validation: name required, points must be a non-negative number', async () => {
    const admin = await createUser('Admin');
    const post = (body: Record<string, unknown>) =>
      request(app).post('/api/community/badges').set('Cookie', authCookie(admin)).send(body);
    expect((await post({ requiredPoints: 5 })).status).toBe(400);
    expect((await post({ name: 'x', requiredPoints: -5 })).status).toBe(400);
    expect((await post({ name: 'x', requiredPoints: 'abc' })).status).toBe(400);
  });

  it('PUT updates name and points; 404 and 400 for bad ids; 400 for negative points', async () => {
    const admin = await createUser('Admin');
    const badge = await createCommunityBadge(admin);
    const res = await request(app)
      .put(`/api/community/badges/${badge._id}`)
      .set('Cookie', authCookie(admin))
      .send({ name: 'Renamed', requiredPoints: 77 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Renamed', requiredPoints: 77 });

    const negative = await request(app)
      .put(`/api/community/badges/${badge._id}`)
      .set('Cookie', authCookie(admin))
      .send({ requiredPoints: -1 });
    expect(negative.status).toBe(400);
    expect(
      (
        await request(app)
          .put(`/api/community/badges/${missingId()}`)
          .set('Cookie', authCookie(admin))
          .send({})
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .put('/api/community/badges/bad')
          .set('Cookie', authCookie(admin))
          .send({})
      ).status,
    ).toBe(400);
  });

  it('PUT replaces the image and deletes the old one', async () => {
    const cloud = mockCloudinary();
    const admin = await createUser('Admin');
    const badge = await createCommunityBadge(admin, { imagePublicId: 'old/badge' });
    const res = await request(app)
      .put(`/api/community/badges/${badge._id}`)
      .set('Cookie', authCookie(admin))
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(200);
    expect(cloud.destroy).toHaveBeenCalledWith('old/badge');
    expect(res.body.data.imagePublicId).toBeUndefined();
  });

  it('PATCH archive archives the badge; GET lists archived badges last', async () => {
    const admin = await createUser('Admin');
    await CommunityBadge.deleteMany({});
    const a = await createCommunityBadge(admin, { name: 'A', requiredPoints: 1 });
    const b = await createCommunityBadge(admin, { name: 'B', requiredPoints: 2 });
    const res = await request(app)
      .patch(`/api/community/badges/${a._id}/archive`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.isArchived).toBe(true);
    expect(res.body.data.archivedAt).toBeTruthy();

    const list = await request(app).get('/api/community/badges').set('Cookie', authCookie(admin));
    expect(list.body.data.map((x: { _id: string }) => x._id)).toEqual([
      String(b._id),
      String(a._id),
    ]);
    const pub = await request(app).get('/api/community');
    expect(pub.body.data.badges.map((x: { _id: string }) => x._id)).toEqual([String(b._id)]);
    expect(
      (
        await request(app)
          .patch(`/api/community/badges/${missingId()}/archive`)
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/community/badges/bad/archive')
          .set('Cookie', authCookie(admin))
      ).status,
    ).toBe(400);
  });
});

describe('community point rules', () => {
  it('GET creates the four default rules', async () => {
    const admin = await createUser('Admin');
    await CommunityPointRule.deleteMany({});
    const res = await request(app)
      .get('/api/community/point-rules')
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    const byKey = Object.fromEntries(
      res.body.data.map((r: { key: string; points: number }) => [r.key, r.points]),
    );
    expect(byKey).toEqual({ acceptedAnswer: 5, createPost: 1, createReply: 1, receiveReaction: 0 });
  });

  it('PUT updates the points and records updatedBy', async () => {
    const admin = await createUser('Super Admin');
    const res = await request(app)
      .put('/api/community/point-rules')
      .set('Cookie', authCookie(admin))
      .send({
        rules: [
          { key: 'createPost', points: 7 },
          { key: 'receiveReaction', points: 2 },
        ],
      });
    expect(res.status).toBe(200);
    const rule = await CommunityPointRule.findOne({ key: 'createPost' }).lean();
    expect(rule?.points).toBe(7);
    expect(String(rule?.updatedBy)).toBe(String(admin._id));
    expect(res.body.data.find((r: { key: string }) => r.key === 'receiveReaction').points).toBe(2);
  });

  it('PUT 400 when rules are missing or empty', async () => {
    const admin = await createUser('Admin');
    for (const body of [{}, { rules: [] }, { rules: 'x' }]) {
      const res = await request(app)
        .put('/api/community/point-rules')
        .set('Cookie', authCookie(admin))
        .send(body);
      expect(res.status).toBe(400);
    }
  });

  it('PUT rejects negative points (the schema minimum is 0)', async () => {
    const admin = await createUser('Admin');
    await request(app).get('/api/community/point-rules').set('Cookie', authCookie(admin));
    const res = await request(app)
      .put('/api/community/point-rules')
      .set('Cookie', authCookie(admin))
      .send({ rules: [{ key: 'createReply', points: -50 }] });
    expect(res.status).toBe(400);
    expect(
      (await CommunityPointRule.findOne({ key: 'createReply' }).lean())?.points,
    ).toBeGreaterThanOrEqual(0);
  });

  it('PUT rejects an unknown rule key and never lets an operator object pick a rule', async () => {
    const admin = await createUser('Admin');
    await request(app).get('/api/community/point-rules').set('Cookie', authCookie(admin));
    const before = await CommunityPointRule.find().sort({ key: 1 }).lean();

    const unknown = await request(app)
      .put('/api/community/point-rules')
      .set('Cookie', authCookie(admin))
      .send({ rules: [{ key: 'bogus', points: 3 }] });
    expect(unknown.status).toBe(400);

    const injected = await request(app)
      .put('/api/community/point-rules')
      .set('Cookie', authCookie(admin))
      .send({ rules: [{ key: { $ne: null }, points: 99 }] });
    expect(injected.status).toBe(400);
    for (const points of ['abc', null, '', { $gt: 0 }, 'Infinity']) {
      const bad = await request(app)
        .put('/api/community/point-rules')
        .set('Cookie', authCookie(admin))
        .send({ rules: [{ key: 'createPost', points }] });
      expect(bad.status, JSON.stringify(points)).toBe(400);
    }
    const mixed = await request(app)
      .put('/api/community/point-rules')
      .set('Cookie', authCookie(admin))
      .send({
        rules: [
          { key: 'createPost', points: 9 },
          { key: 'bogus', points: 1 },
        ],
      });
    expect(mixed.status).toBe(400);
    const after = await CommunityPointRule.find().sort({ key: 1 }).lean();
    expect(after.map((r) => r.points)).toEqual(before.map((r) => r.points));
  });
});

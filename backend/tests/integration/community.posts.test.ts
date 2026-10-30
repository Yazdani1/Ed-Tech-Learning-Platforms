import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { CommunityPointRule } from '../../src/models/CommunityPointRule.model';
import { CommunityPost } from '../../src/models/CommunityPost.model';
import { PNG_BYTES, authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import {
  createCommunityAnswerReply,
  createCommunityChannel,
  createCommunityPost,
  createCommunityReply,
  pointsOf,
} from '../factories/community';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => vi.restoreAllMocks());

const png = { filename: 'a.png', contentType: 'image/png' };

describe('POST /api/community/posts', () => {
  it('401 without a token', async () => {
    expect((await request(app).post('/api/community/posts').send({})).status).toBe(401);
  });

  it('every signed-in role can create a post (201), the author is the caller and points are awarded', async () => {
    const users = await createUsersForAllRoles();
    await CommunityPointRule.deleteMany({});
    await CommunityPointRule.create({ key: 'createPost', label: 'x', points: 3 });
    const channel = await createCommunityChannel();
    for (const user of Object.values(users)) {
      const res = await request(app)
        .post('/api/community/posts')
        .set('Cookie', authCookie(user))
        .send({ channel: String(channel._id), title: 'Hello', description: 'World' });
      expect(res.status, user.role).toBe(201);
      expect(res.body.data.author._id).toBe(String(user._id));
      expect(res.body.data.author.email).toBeUndefined();
      expect(res.body.data.replies).toEqual([]);
      expect(await pointsOf(user)).toBe(3);
    }
  });

  it('uploads up to 8 images and sets the first as the cover image', async () => {
    const cloud = mockCloudinary();
    const user = await createUser('Student');
    const channel = await createCommunityChannel();
    const res = await request(app)
      .post('/api/community/posts')
      .set('Cookie', authCookie(user))
      .field('channel', String(channel._id))
      .field('title', 'With images')
      .field('description', 'Body')
      .attach('images', PNG_BYTES, png)
      .attach('images', PNG_BYTES, png);

    expect(res.status).toBe(201);
    expect(cloud.upload).toHaveBeenCalledTimes(2);
    expect(res.body.data.images).toHaveLength(2);
    expect(res.body.data.imageUrl).toBe(res.body.data.images[0].url);
    expect(res.body.data.images[0].publicId).toBeUndefined();
  });

  it('400 for a non-image file', async () => {
    mockCloudinary();
    const user = await createUser('Student');
    const channel = await createCommunityChannel();
    const text = await request(app)
      .post('/api/community/posts')
      .set('Cookie', authCookie(user))
      .field('channel', String(channel._id))
      .field('title', 't')
      .field('description', 'd')
      .attach('images', Buffer.from('hi'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(text.status).toBe(400);
  });

  it('400 (not 500) for a 9th image', async () => {
    mockCloudinary();
    const user = await createUser('Student');
    const channel = await createCommunityChannel();
    let req = request(app)
      .post('/api/community/posts')
      .set('Cookie', authCookie(user))
      .field('channel', String(channel._id))
      .field('title', 't')
      .field('description', 'd');
    for (let i = 0; i < 9; i += 1) req = req.attach('images', PNG_BYTES, png);
    expect((await req).status).toBe(400);
  });

  it('400 when channel, title or description is missing or blank', async () => {
    const user = await createUser('Student');
    const channel = await createCommunityChannel();
    const base = { channel: String(channel._id), title: 'T', description: 'D' };
    for (const key of ['channel', 'title', 'description'] as const) {
      const res = await request(app)
        .post('/api/community/posts')
        .set('Cookie', authCookie(user))
        .send({ ...base, [key]: ' ' });
      expect(res.status, key).toBe(400);
    }
  });

  it('404 for an unknown or archived channel, 400 for a malformed channel id', async () => {
    const user = await createUser('Student');
    const archived = await createCommunityChannel({ isArchived: true });
    const post = (channel: string) =>
      request(app)
        .post('/api/community/posts')
        .set('Cookie', authCookie(user))
        .send({ channel, title: 'T', description: 'D' });
    expect((await post(missingId())).status).toBe(404);
    expect((await post(String(archived._id))).status).toBe(404);
    expect((await post('bad')).status).toBe(400);
  });

  it('rejects an operator object as the channel (no injection into the query)', async () => {
    const user = await createUser('Student');
    await createCommunityChannel();
    const res = await request(app)
      .post('/api/community/posts')
      .set('Cookie', authCookie(user))
      .send({ channel: { $ne: null }, title: 'T', description: 'D' });
    expect(res.status).toBe(400);
  });
});

describe('POST + PUT /api/community/posts: text fields must be text', () => {
  it('answers 400 (not 500) when title or description is an object or array', async () => {
    const user = await createUser('Student');
    const channel = await createCommunityChannel();
    const post = await createCommunityPost(user);
    const base = { channel: String(channel._id), title: 'T', description: 'D' };
    for (const [key, value] of [
      ['title', { $gt: '' }],
      ['description', ['a', 'b']],
    ] as const) {
      const created = await request(app)
        .post('/api/community/posts')
        .set('Cookie', authCookie(user))
        .send({ ...base, [key]: value });
      expect(created.status, key).toBe(400);
      const updated = await request(app)
        .put(`/api/community/posts/${post._id}`)
        .set('Cookie', authCookie(user))
        .send({ [key]: value });
      expect(updated.status, key).toBe(400);
    }
    expect(await CommunityPost.countDocuments({ author: user._id })).toBe(1);
  });
});

describe('GET /api/community/posts/:postId', () => {
  it('returns the post with replies, child replies, counts, badges and channels (guest allowed)', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    const reply = await createCommunityReply(author, post._id);
    await createCommunityAnswerReply(author, reply._id);
    await createCommunityReply(author, post._id, { isArchived: true });

    const res = await request(app).get(`/api/community/posts/${post._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.post._id).toBe(String(post._id));
    expect(res.body.data.post.replyCount).toBe(1);
    expect(res.body.data.post.replies).toHaveLength(1);
    expect(res.body.data.post.replies[0].childReplyCount).toBe(1);
    expect(res.body.data.post.replies[0].childReplies).toHaveLength(1);
    expect(res.body.data.repliesPagination).toMatchObject({ total: 1, hasMore: false });
    expect(res.body.data.post.author.email).toBeUndefined();
    expect(Array.isArray(res.body.data.badges)).toBe(true);
    expect(Array.isArray(res.body.data.channels)).toBe(true);
  });

  it('repliesLimit limits the replies (max 50) and sets hasMore', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    for (let i = 0; i < 3; i += 1) await createCommunityReply(author, post._id);
    const res = await request(app)
      .get(`/api/community/posts/${post._id}`)
      .query({ repliesLimit: 2 });
    expect(res.body.data.post.replies).toHaveLength(2);
    expect(res.body.data.repliesPagination).toMatchObject({ total: 3, limit: 2, hasMore: true });
    const big = await request(app)
      .get(`/api/community/posts/${post._id}`)
      .query({ repliesLimit: 999 });
    expect(big.body.data.repliesPagination.limit).toBe(50);
  });

  it('puts the accepted reply first', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    await createCommunityReply(author, post._id);
    const accepted = await createCommunityReply(author, post._id, { isAccepted: true });
    const res = await request(app).get(`/api/community/posts/${post._id}`);
    expect(res.body.data.post.replies[0]._id).toBe(String(accepted._id));
  });

  it('404 for a missing post, 400 for a malformed id, and archived posts are hidden', async () => {
    const author = await createUser('Student');
    const archived = await createCommunityPost(author, { isArchived: true });
    expect((await request(app).get(`/api/community/posts/${missingId()}`)).status).toBe(404);
    expect((await request(app).get('/api/community/posts/bad')).status).toBe(400);
    expect((await request(app).get(`/api/community/posts/${archived._id}`)).status).toBe(404);
  });

  it('archived=true: only Super Admin and Admin (403 for guests and other roles)', async () => {
    const users = await createUsersForAllRoles();
    const archived = await createCommunityPost(users.Student, { isArchived: true });
    const url = `/api/community/posts/${archived._id}?archived=true`;
    expect((await request(app).get(url)).status).toBe(403);
    for (const role of ['Moderator', 'Teacher', 'Student'] as const) {
      expect((await request(app).get(url).set('Cookie', authCookie(users[role]))).status).toBe(403);
    }
    for (const role of ['Super Admin', 'Admin'] as const) {
      const res = await request(app).get(url).set('Cookie', authCookie(users[role]));
      expect(res.status).toBe(200);
      expect(res.body.data.post.isArchived).toBe(true);
    }
  });
});

describe('GET /api/community/posts/:postId/replies', () => {
  it('paginates top-level replies in creation order with child replies attached', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    const a = await createCommunityReply(author, post._id, { createdAt: new Date('2024-01-01') });
    const b = await createCommunityReply(author, post._id, { createdAt: new Date('2024-01-02') });
    const c = await createCommunityReply(author, post._id, { createdAt: new Date('2024-01-03') });
    await createCommunityAnswerReply(author, a._id);

    const first = await request(app)
      .get(`/api/community/posts/${post._id}/replies`)
      .query({ limit: 2 });
    expect(first.status).toBe(200);
    expect(first.body.data.replies.map((r: { _id: string }) => r._id)).toEqual([
      String(a._id),
      String(b._id),
    ]);
    expect(first.body.data).toMatchObject({ total: 3, limit: 2, skip: 0, hasMore: true });
    expect(first.body.data.replies[0].childReplyCount).toBe(1);

    const second = await request(app)
      .get(`/api/community/posts/${post._id}/replies`)
      .query({ limit: 2, skip: 2 });
    expect(second.body.data.replies.map((r: { _id: string }) => r._id)).toEqual([String(c._id)]);
    expect(second.body.data.hasMore).toBe(false);
  });

  it('404 for a missing or archived post, 400 for a malformed id', async () => {
    const author = await createUser('Student');
    const archived = await createCommunityPost(author, { isArchived: true });
    expect((await request(app).get(`/api/community/posts/${missingId()}/replies`)).status).toBe(
      404,
    );
    expect((await request(app).get(`/api/community/posts/${archived._id}/replies`)).status).toBe(
      404,
    );
    expect((await request(app).get('/api/community/posts/bad/replies')).status).toBe(400);
  });
});

describe('PUT /api/community/posts/:postId', () => {
  it('401 without a token', async () => {
    expect((await request(app).put(`/api/community/posts/${missingId()}`).send({})).status).toBe(
      401,
    );
  });

  it('the author can edit title, description and move the post to another channel', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    const target = await createCommunityChannel();
    const res = await request(app)
      .put(`/api/community/posts/${post._id}`)
      .set('Cookie', authCookie(author))
      .send({ title: 'New', description: 'Changed', channel: String(target._id) });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'New', description: 'Changed' });
    expect(res.body.data.channel._id).toBe(String(target._id));
  });

  it('Super Admin, Admin and Moderator can edit any post; Teacher and Student cannot edit others (403)', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    const post = await createCommunityPost(owner);
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const res = await request(app)
        .put(`/api/community/posts/${post._id}`)
        .set('Cookie', authCookie(users[role]))
        .send({ title: `By ${role}` });
      expect(res.status, role).toBe(200);
    }
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .put(`/api/community/posts/${post._id}`)
        .set('Cookie', authCookie(users[role]))
        .send({ title: 'Hacked' });
      expect(res.status, role).toBe(403);
    }
    expect((await CommunityPost.findById(post._id).lean())?.title).toBe('By Moderator');
  });

  it('new images replace the old ones and the old Cloudinary files are deleted', async () => {
    const cloud = mockCloudinary();
    const author = await createUser('Student');
    const post = await createCommunityPost(author, {
      imagePublicId: 'old/cover',
      images: [{ url: 'https://x/1.png', publicId: 'old/one' }],
    });
    const res = await request(app)
      .put(`/api/community/posts/${post._id}`)
      .set('Cookie', authCookie(author))
      .attach('images', PNG_BYTES, png);
    expect(res.status).toBe(200);
    expect(cloud.destroy).toHaveBeenCalledWith('old/cover');
    expect(cloud.destroy).toHaveBeenCalledWith('old/one');
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].url).toContain('community/posts');
  });

  it('404 for missing, archived or unknown-channel; 400 for malformed ids', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    const archived = await createCommunityPost(author, { isArchived: true });
    const put = (id: string, body: Record<string, unknown> = {}) =>
      request(app).put(`/api/community/posts/${id}`).set('Cookie', authCookie(author)).send(body);
    expect((await put(missingId())).status).toBe(404);
    expect((await put(String(archived._id))).status).toBe(404);
    expect((await put(String(post._id), { channel: missingId() })).status).toBe(404);
    expect((await put('bad')).status).toBe(400);
    expect((await put(String(post._id), { channel: 'bad' })).status).toBe(400);
  });
});

describe('PATCH /api/community/posts/:postId/archive', () => {
  it('401 without a token', async () => {
    expect((await request(app).patch(`/api/community/posts/${missingId()}/archive`)).status).toBe(
      401,
    );
  });

  it('the author archives their own post (stored with archivedBy/archivedAt)', async () => {
    const author = await createUser('Student');
    const post = await createCommunityPost(author);
    const res = await request(app)
      .patch(`/api/community/posts/${post._id}/archive`)
      .set('Cookie', authCookie(author));
    expect(res.status).toBe(200);
    expect(res.body.data.isArchived).toBe(true);
    const saved = await CommunityPost.findById(post._id).lean();
    expect(String(saved?.archivedBy)).toBe(String(author._id));
    expect(saved?.archivedAt).toBeTruthy();
  });

  it('staff can archive any post; Teacher and other Students get 403', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    for (const role of ['Teacher', 'Student'] as const) {
      const post = await createCommunityPost(owner);
      const res = await request(app)
        .patch(`/api/community/posts/${post._id}/archive`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(403);
      expect((await CommunityPost.findById(post._id).lean())?.isArchived).toBe(false);
    }
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const post = await createCommunityPost(owner);
      const res = await request(app)
        .patch(`/api/community/posts/${post._id}/archive`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(200);
    }
  });

  it('404 / 400 for unknown or malformed id', async () => {
    const user = await createUser('Admin');
    expect(
      (
        await request(app)
          .patch(`/api/community/posts/${missingId()}/archive`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).patch('/api/community/posts/bad/archive').set('Cookie', authCookie(user)))
        .status,
    ).toBe(400);
  });
});

describe('PATCH /api/community/posts/:postId/pin', () => {
  it('401 without a token; 403 for Teacher and Student, even the post author', async () => {
    const users = await createUsersForAllRoles();
    const post = await createCommunityPost(users.Student);
    expect((await request(app).patch(`/api/community/posts/${post._id}/pin`)).status).toBe(401);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .patch(`/api/community/posts/${post._id}/pin`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(403);
    }
  });

  it('Super Admin, Admin and Moderator toggle the pin on and off', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const post = await createCommunityPost(owner);
      const on = await request(app)
        .patch(`/api/community/posts/${post._id}/pin`)
        .set('Cookie', authCookie(users[role]));
      expect(on.status).toBe(200);
      expect(on.body.data.isPinned).toBe(true);
      expect(on.body.data.pinnedBy).toBe(String(users[role]._id));
      expect(on.body.data.pinnedAt).toBeTruthy();
      const off = await request(app)
        .patch(`/api/community/posts/${post._id}/pin`)
        .set('Cookie', authCookie(users[role]));
      expect(off.body.data.isPinned).toBe(false);
      expect(off.body.data.pinnedAt).toBeUndefined();
    }
  });

  it('404 / 400 for unknown or malformed id', async () => {
    const user = await createUser('Moderator');
    expect(
      (
        await request(app)
          .patch(`/api/community/posts/${missingId()}/pin`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (await request(app).patch('/api/community/posts/bad/pin').set('Cookie', authCookie(user)))
        .status,
    ).toBe(400);
  });
});

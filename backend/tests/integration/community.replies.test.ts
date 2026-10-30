import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { CommunityAnswerReply } from '../../src/models/CommunityAnswerReply.model';
import { CommunityPointRule } from '../../src/models/CommunityPointRule.model';
import { CommunityPost } from '../../src/models/CommunityPost.model';
import { CommunityReply } from '../../src/models/CommunityReply.model';
import { User } from '../../src/models/User.model';
import { PNG_BYTES, authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import {
  createCommunityAnswerReply,
  createCommunityPost,
  createCommunityReply,
  pointsOf,
} from '../factories/community';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => vi.restoreAllMocks());

const setRules = async (rules: Record<string, number>) => {
  await CommunityPointRule.deleteMany({});
  await CommunityPointRule.insertMany(
    Object.entries(rules).map(([key, points]) => ({ key, label: key, points })),
  );
};

describe('POST /api/community/posts/:postId/replies', () => {
  beforeEach(() => setRules({ createReply: 2 }));

  it('401 without a token', async () => {
    const res = await request(app)
      .post(`/api/community/posts/${missingId()}/replies`)
      .send({ body: 'x' });
    expect(res.status).toBe(401);
  });

  it('any signed-in role can reply: 201, saved with the caller as author, points awarded', async () => {
    const users = await createUsersForAllRoles();
    const post = await createCommunityPost(users.Student);
    for (const user of Object.values(users)) {
      const res = await request(app)
        .post(`/api/community/posts/${post._id}/replies`)
        .set('Cookie', authCookie(user))
        .send({ body: 'My answer' });
      expect(res.status, user.role).toBe(201);
      expect(res.body.data.author._id).toBe(String(user._id));
      expect(res.body.data.author.email).toBeUndefined();
      expect(res.body.data.isAccepted).toBe(false);
      expect(await pointsOf(user)).toBe(2);
    }
    expect(await CommunityReply.countDocuments({ post: post._id })).toBe(5);
  });

  it('uploads images', async () => {
    const cloud = mockCloudinary();
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    const res = await request(app)
      .post(`/api/community/posts/${post._id}/replies`)
      .set('Cookie', authCookie(user))
      .field('body', 'With picture')
      .attach('images', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(cloud.upload).toHaveBeenCalledTimes(1);
    expect(res.body.data.images[0].url).toContain('community/replies');
  });

  it('400 for a blank body; 404 for a missing or archived post; 400 for a malformed id', async () => {
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    const archived = await createCommunityPost(user, { isArchived: true });
    const send = (id: string, body: unknown) =>
      request(app)
        .post(`/api/community/posts/${id}/replies`)
        .set('Cookie', authCookie(user))
        .send({ body });
    expect((await send(String(post._id), '   ')).status).toBe(400);
    expect((await send(String(post._id), undefined)).status).toBe(400);
    expect((await send(missingId(), 'x')).status).toBe(404);
    expect((await send(String(archived._id), 'x')).status).toBe(404);
    expect((await send('bad', 'x')).status).toBe(400);
  });

  it('answers 400 (not 500) when the body is not text', async () => {
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    const res = await request(app)
      .post(`/api/community/posts/${post._id}/replies`)
      .set('Cookie', authCookie(user))
      .send({ body: { $gt: '' } });
    expect(res.status).toBe(400);
  });
});

describe('answer replies (child replies)', () => {
  it('POST creates a child reply (201) and GET lists them in order with pagination', async () => {
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    const reply = await createCommunityReply(user, post._id);

    const created = await request(app)
      .post(`/api/community/replies/${reply._id}/replies`)
      .set('Cookie', authCookie(user))
      .send({ body: 'first' });
    expect(created.status).toBe(201);
    expect(created.body.data.author._id).toBe(String(user._id));
    await createCommunityAnswerReply(user, reply._id, {
      body: 'second',
      createdAt: new Date(Date.now() + 1000),
    });
    await createCommunityAnswerReply(user, reply._id, { body: 'archived', isArchived: true });

    const res = await request(app)
      .get(`/api/community/replies/${reply._id}/replies`)
      .query({ limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.replies.map((r: { body: string }) => r.body)).toEqual(['first']);
    expect(res.body.data).toMatchObject({ total: 2, limit: 1, skip: 0, hasMore: true });
    const next = await request(app)
      .get(`/api/community/replies/${reply._id}/replies`)
      .query({ limit: 1, skip: 1 });
    expect(next.body.data.replies.map((r: { body: string }) => r.body)).toEqual(['second']);
  });

  it('POST: 401, 400 blank body, 404 for missing or archived reply or archived discussion, 400 malformed id', async () => {
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    const reply = await createCommunityReply(user, post._id);
    const archivedReply = await createCommunityReply(user, post._id, { isArchived: true });
    const archivedPost = await createCommunityPost(user, { isArchived: true });
    const orphan = await createCommunityReply(user, archivedPost._id);
    const send = (id: string, body: unknown) =>
      request(app)
        .post(`/api/community/replies/${id}/replies`)
        .set('Cookie', authCookie(user))
        .send({ body });

    expect(
      (await request(app).post(`/api/community/replies/${reply._id}/replies`).send({ body: 'x' }))
        .status,
    ).toBe(401);
    expect((await send(String(reply._id), ' ')).status).toBe(400);
    expect((await send(String(reply._id), { $gt: '' })).status).toBe(400);
    expect((await send(missingId(), 'x')).status).toBe(404);
    expect((await send(String(archivedReply._id), 'x')).status).toBe(404);
    expect((await send(String(orphan._id), 'x')).status).toBe(404);
    expect((await send('bad', 'x')).status).toBe(400);
  });

  it('GET: 404 for missing reply or archived discussion, 400 for a malformed id', async () => {
    const user = await createUser('Student');
    const archivedPost = await createCommunityPost(user, { isArchived: true });
    const orphan = await createCommunityReply(user, archivedPost._id);
    expect((await request(app).get(`/api/community/replies/${missingId()}/replies`)).status).toBe(
      404,
    );
    expect((await request(app).get(`/api/community/replies/${orphan._id}/replies`)).status).toBe(
      404,
    );
    expect((await request(app).get('/api/community/replies/bad/replies')).status).toBe(400);
  });

  it('PATCH archive: the author and staff can delete; other Students and Teachers get 403', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    const post = await createCommunityPost(owner);
    const reply = await createCommunityReply(owner, post._id);
    const archive = (id: unknown, user: (typeof users)[keyof typeof users]) =>
      request(app)
        .patch(`/api/community/answer-replies/${id}/archive`)
        .set('Cookie', authCookie(user));

    expect(
      (await request(app).patch(`/api/community/answer-replies/${missingId()}/archive`)).status,
    ).toBe(401);
    for (const role of ['Teacher', 'Student'] as const) {
      const child = await createCommunityAnswerReply(owner, reply._id);
      expect((await archive(child._id, users[role])).status, role).toBe(403);
    }
    for (const user of [owner, users['Super Admin'], users.Admin, users.Moderator]) {
      const child = await createCommunityAnswerReply(owner, reply._id);
      const res = await archive(child._id, user);
      expect(res.status, user.role).toBe(200);
      expect(res.body.data._id).toBe(String(child._id));
      const saved = await CommunityAnswerReply.findById(child._id).lean();
      expect(saved?.isArchived).toBe(true);
      expect(String(saved?.archivedBy)).toBe(String(user._id));
    }
  });

  it('PATCH archive: 404 for missing, already archived, or parents archived; 400 for malformed id', async () => {
    const user = await createUser('Admin');
    const post = await createCommunityPost(user);
    const reply = await createCommunityReply(user, post._id);
    const done = await createCommunityAnswerReply(user, reply._id, { isArchived: true });
    const archivedReply = await createCommunityReply(user, post._id, { isArchived: true });
    const underArchivedReply = await createCommunityAnswerReply(user, archivedReply._id);
    const archivedPost = await createCommunityPost(user, { isArchived: true });
    const lonelyReply = await createCommunityReply(user, archivedPost._id);
    const underArchivedPost = await createCommunityAnswerReply(user, lonelyReply._id);
    const archive = (id: unknown) =>
      request(app)
        .patch(`/api/community/answer-replies/${id}/archive`)
        .set('Cookie', authCookie(user));
    expect((await archive(missingId())).status).toBe(404);
    expect((await archive(done._id)).status).toBe(404);
    expect((await archive(underArchivedReply._id)).status).toBe(404);
    expect((await archive(underArchivedPost._id)).status).toBe(404);
    expect((await archive('bad')).status).toBe(400);
  });
});

describe('PATCH /api/community/replies/:replyId/archive', () => {
  it('the author and staff archive; Teacher and other Students get 403; 401 without token', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    const post = await createCommunityPost(owner);
    expect((await request(app).patch(`/api/community/replies/${missingId()}/archive`)).status).toBe(
      401,
    );
    for (const role of ['Teacher', 'Student'] as const) {
      const reply = await createCommunityReply(owner, post._id);
      const res = await request(app)
        .patch(`/api/community/replies/${reply._id}/archive`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(403);
      expect((await CommunityReply.findById(reply._id).lean())?.isArchived).toBe(false);
    }
    for (const user of [owner, users['Super Admin'], users.Admin, users.Moderator]) {
      const reply = await createCommunityReply(owner, post._id);
      const res = await request(app)
        .patch(`/api/community/replies/${reply._id}/archive`)
        .set('Cookie', authCookie(user));
      expect(res.status, user.role).toBe(200);
      const saved = await CommunityReply.findById(reply._id).lean();
      expect(saved?.isArchived).toBe(true);
      expect(String(saved?.archivedBy)).toBe(String(user._id));
    }
  });

  it('404 for missing, archived, or reply of an archived discussion; 400 for malformed id', async () => {
    const user = await createUser('Admin');
    const post = await createCommunityPost(user);
    const archivedReply = await createCommunityReply(user, post._id, { isArchived: true });
    const archivedPost = await createCommunityPost(user, { isArchived: true });
    const orphan = await createCommunityReply(user, archivedPost._id);
    const archive = (id: unknown) =>
      request(app).patch(`/api/community/replies/${id}/archive`).set('Cookie', authCookie(user));
    expect((await archive(missingId())).status).toBe(404);
    expect((await archive(archivedReply._id)).status).toBe(404);
    expect((await archive(orphan._id)).status).toBe(404);
    expect((await archive('bad')).status).toBe(400);
  });
});

describe('reactions', () => {
  beforeEach(() => setRules({ receiveReaction: 4 }));

  it('post: add, change and remove a reaction (toggle); author earns points; response is the populated post', async () => {
    const author = await createUser('Student');
    const reactor = await createUser('Teacher');
    const post = await createCommunityPost(author);
    const react = (type: unknown) =>
      request(app)
        .patch(`/api/community/posts/${post._id}/reactions`)
        .set('Cookie', authCookie(reactor))
        .send({ type });

    const add = await react('Like');
    expect(add.status).toBe(200);
    expect(add.body.data.reactions).toHaveLength(1);
    expect(add.body.data.reactions[0]).toMatchObject({ type: 'Like' });
    expect(add.body.data.reactions[0].user._id).toBe(String(reactor._id));
    expect(await pointsOf(author)).toBe(4);

    const change = await react('Love');
    expect(change.body.data.reactions).toHaveLength(1);
    expect(change.body.data.reactions[0].type).toBe('Love');

    const remove = await react('Love');
    expect(remove.body.data.reactions).toHaveLength(0);
    expect((await CommunityPost.findById(post._id).lean())?.reactions).toHaveLength(0);
  });

  it('post: removing and adding a reaction again does not earn the author points again', async () => {
    const author = await createUser('Student');
    const reactor = await createUser('Student');
    const post = await createCommunityPost(author);
    const react = () =>
      request(app)
        .patch(`/api/community/posts/${post._id}/reactions`)
        .set('Cookie', authCookie(reactor))
        .send({ type: 'Like' });
    await react();
    await react();
    await react();
    expect(await pointsOf(author)).toBe(4);
  });

  it('post: every valid reaction type works, others are 400, 401 without token, 404 / 400 for ids', async () => {
    const user = await createUser('Student');
    const post = await createCommunityPost(user);
    for (const type of ['Like', 'Love', 'Wow', 'Sad', 'Angry', 'Helpful']) {
      const res = await request(app)
        .patch(`/api/community/posts/${post._id}/reactions`)
        .set('Cookie', authCookie(user))
        .send({ type });
      expect(res.status, type).toBe(200);
    }
    const patch = (id: string, type: unknown) =>
      request(app)
        .patch(`/api/community/posts/${id}/reactions`)
        .set('Cookie', authCookie(user))
        .send({ type });
    expect((await patch(String(post._id), 'Hate')).status).toBe(400);
    expect((await patch(String(post._id), undefined)).status).toBe(400);
    expect((await patch(String(post._id), { $ne: 1 })).status).toBe(400);
    expect((await patch(missingId(), 'Like')).status).toBe(404);
    expect((await patch('bad', 'Like')).status).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/community/posts/${post._id}/reactions`)
          .send({ type: 'Like' })
      ).status,
    ).toBe(401);
    const archived = await createCommunityPost(user, { isArchived: true });
    expect((await patch(String(archived._id), 'Like')).status).toBe(404);
  });

  it('reply: add, change and remove; author earns points; 400 / 401 / 404 cases', async () => {
    const author = await createUser('Student');
    const reactor = await createUser('Student');
    const post = await createCommunityPost(author);
    const reply = await createCommunityReply(author, post._id);
    const react = (type: unknown, id: string = String(reply._id)) =>
      request(app)
        .patch(`/api/community/replies/${id}/reactions`)
        .set('Cookie', authCookie(reactor))
        .send({ type });

    const add = await react('Helpful');
    expect(add.status).toBe(200);
    expect(add.body.data.reactions).toHaveLength(1);
    expect(await pointsOf(author)).toBe(4);
    expect((await react('Wow')).body.data.reactions[0].type).toBe('Wow');
    expect((await react('Wow')).body.data.reactions).toHaveLength(0);

    expect((await react('Nope')).status).toBe(400);
    expect((await react('Like', missingId())).status).toBe(404);
    expect((await react('Like', 'bad')).status).toBe(400);
    expect(
      (
        await request(app)
          .patch(`/api/community/replies/${reply._id}/reactions`)
          .send({ type: 'Like' })
      ).status,
    ).toBe(401);
    const archivedPost = await createCommunityPost(author, { isArchived: true });
    const orphan = await createCommunityReply(author, archivedPost._id);
    expect((await react('Like', String(orphan._id))).status).toBe(404);
  });

  it('removing a reaction takes back its points; changing the type gives nothing extra (post and reply)', async () => {
    const author = await createUser('Student');
    const reactor = await createUser('Student');
    const post = await createCommunityPost(author);
    const reply = await createCommunityReply(author, post._id);
    for (const path of [`posts/${post._id}`, `replies/${reply._id}`]) {
      const react = (type: string) =>
        request(app)
          .patch(`/api/community/${path}/reactions`)
          .set('Cookie', authCookie(reactor))
          .send({ type });
      await react('Like');
      expect(await pointsOf(author), path).toBe(4);
      await react('Love');
      expect(await pointsOf(author), path).toBe(4);
      await react('Love');
      expect(await pointsOf(author), path).toBe(0);
      await react('Like');
      await react('Like');
      await react('Like');
      expect(await pointsOf(author), path).toBe(4);
      await react('Like');
    }
    expect(await pointsOf(author)).toBe(0);
  });

  it('reacting to your own post or reply gives no points; removal never drops points below 0', async () => {
    const author = await createUser('Student');
    const reactor = await createUser('Student');
    const post = await createCommunityPost(author);
    const reply = await createCommunityReply(author, post._id);
    for (const path of [`posts/${post._id}`, `replies/${reply._id}`]) {
      await request(app)
        .patch(`/api/community/${path}/reactions`)
        .set('Cookie', authCookie(author))
        .send({ type: 'Like' });
      expect(await pointsOf(author), path).toBe(0);
    }

    await request(app)
      .patch(`/api/community/posts/${post._id}/reactions`)
      .set('Cookie', authCookie(reactor))
      .send({ type: 'Like' });
    await User.updateOne({ _id: author._id }, { communityPoints: 1 });
    await request(app)
      .patch(`/api/community/posts/${post._id}/reactions`)
      .set('Cookie', authCookie(reactor))
      .send({ type: 'Like' });
    expect(await pointsOf(author)).toBe(0);
  });
});

describe('PATCH /api/community/replies/:replyId/accepted', () => {
  beforeEach(() => setRules({ acceptedAnswer: 6 }));

  it('only the discussion creator can accept: others (even staff) get 403', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    const answerer = await createUser('Student');
    const post = await createCommunityPost(owner);
    const reply = await createCommunityReply(answerer, post._id);
    expect((await request(app).patch(`/api/community/replies/${reply._id}/accepted`)).status).toBe(
      401,
    );
    for (const user of Object.values(users)) {
      const res = await request(app)
        .patch(`/api/community/replies/${reply._id}/accepted`)
        .set('Cookie', authCookie(user));
      expect(res.status, user.role).toBe(403);
    }
    expect((await CommunityReply.findById(reply._id).lean())?.isAccepted).toBe(false);
  });

  it('toggles accepted, stores acceptedAt, and awards points only the first time', async () => {
    const owner = await createUser('Student');
    const answerer = await createUser('Student');
    const post = await createCommunityPost(owner);
    const reply = await createCommunityReply(answerer, post._id);
    const toggle = () =>
      request(app)
        .patch(`/api/community/replies/${reply._id}/accepted`)
        .set('Cookie', authCookie(owner));

    const on = await toggle();
    expect(on.status).toBe(200);
    expect(on.body.data.isAccepted).toBe(true);
    expect(on.body.data.acceptedAt).toBeTruthy();
    expect(await pointsOf(answerer)).toBe(6);

    const off = await toggle();
    expect(off.body.data.isAccepted).toBe(false);
    expect(off.body.data.acceptedAt).toBeUndefined();

    await toggle();
    expect(await pointsOf(answerer)).toBe(6);
  });

  it('accepting your own reply on your own discussion gives no points', async () => {
    const owner = await createUser('Student');
    const post = await createCommunityPost(owner);
    const reply = await createCommunityReply(owner, post._id);
    const before = await pointsOf(owner);
    const res = await request(app)
      .patch(`/api/community/replies/${reply._id}/accepted`)
      .set('Cookie', authCookie(owner));
    expect(res.status).toBe(200);
    expect(res.body.data.isAccepted).toBe(true);
    expect(await pointsOf(owner)).toBe(before);
  });

  it('404 for missing or archived reply, 400 for malformed id', async () => {
    const owner = await createUser('Student');
    const post = await createCommunityPost(owner);
    const archived = await createCommunityReply(owner, post._id, { isArchived: true });
    const toggle = (id: unknown) =>
      request(app).patch(`/api/community/replies/${id}/accepted`).set('Cookie', authCookie(owner));
    expect((await toggle(missingId())).status).toBe(404);
    expect((await toggle(archived._id)).status).toBe(404);
    expect((await toggle('bad')).status).toBe(400);
  });
});

describe('points awarded by default rules', () => {
  it('uses the built-in defaults (post 1, reply 1) when no rule is stored', async () => {
    await CommunityPointRule.deleteMany({});
    const user = await createUser('Student');
    const channelPost = await createCommunityPost(user);
    await request(app)
      .post(`/api/community/posts/${channelPost._id}/replies`)
      .set('Cookie', authCookie(user))
      .send({ body: 'x' });
    expect(await pointsOf(user)).toBe(1);
    await request(app)
      .post('/api/community/posts')
      .set('Cookie', authCookie(user))
      .send({ channel: String(channelPost.channel), title: 'T', description: 'D' });
    expect(await pointsOf(user)).toBe(2);
  });
});

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { CommunityBadge } from '../../src/models/CommunityBadge.model';
import { CommunityPost } from '../../src/models/CommunityPost.model';
import { authCookie, bearer, createUser, createUsersForAllRoles, missingId } from '../factories';
import {
  createCommunityAnswerReply,
  createCommunityBadge,
  createCommunityChannel,
  createCommunityPost,
  createCommunityReply,
} from '../factories/community';

describe('GET /api/community (overview)', () => {
  it('works for a guest: guestLimited, at most 10 posts, skip ignored', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    for (let i = 0; i < 12; i += 1) await createCommunityPost(author, { channel: channel._id });

    const res = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id), limit: 50, skip: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.guestLimited).toBe(true);
    expect(res.body.data.posts).toHaveLength(10);
    expect(res.body.data.postPagination).toMatchObject({
      skip: 0,
      limit: 10,
      loaded: 10,
      hasMore: false,
    });
    expect(res.body.data.resultPostCount).toBe(12);
  });

  it('signed-in users get up to 50 posts, skip and hasMore', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    for (let i = 0; i < 12; i += 1) await createCommunityPost(author, { channel: channel._id });

    const res = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id), limit: 5, skip: 5 })
      .set('Cookie', authCookie(author));

    expect(res.status).toBe(200);
    expect(res.body.data.guestLimited).toBe(false);
    expect(res.body.data.posts).toHaveLength(5);
    expect(res.body.data.postPagination).toMatchObject({ skip: 5, limit: 5, hasMore: true });

    const capped = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id), limit: 500 })
      .set('Cookie', authCookie(author));
    expect(capped.body.data.postPagination.limit).toBe(50);
  });

  it('accepts the Bearer header', async () => {
    const user = await createUser('Student');
    const res = await request(app).get('/api/community').set('Authorization', bearer(user));
    expect(res.status).toBe(200);
    expect(res.body.data.guestLimited).toBe(false);
  });

  it('returns the overview shape: channels, settings, badges, counts and widgets', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    const post = await createCommunityPost(author, { channel: channel._id });
    await createCommunityReply(author, post._id);
    await createCommunityBadge(author);

    const res = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id) });

    const data = res.body.data;
    expect(data.channels.some((c: { _id: string }) => c._id === String(channel._id))).toBe(true);
    expect(data.channelPostCounts[String(channel._id)]).toBe(1);
    expect(data.channelReplyCounts[String(channel._id)]).toBe(1);
    expect(data.settings.title).toBeTruthy();
    expect(data.totalMemberCount).toBeGreaterThan(0);
    expect(data.badges.length).toBeGreaterThan(0);
    expect(data.widgets).toHaveProperty('mostAnsweredPosts');
    expect(data.widgets).toHaveProperty('topContributors');
    expect(data.widgets).toHaveProperty('onlineMembers');
    expect(data.posts[0].replies).toHaveLength(1);
    expect(data.posts[0].author.password).toBeUndefined();
    expect(data.posts[0].author.email).toBeUndefined();
  });

  it('hides archived posts, archived channels and archived replies', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    const archivedChannel = await createCommunityChannel({ isArchived: true });
    const live = await createCommunityPost(author, { channel: channel._id });
    await createCommunityPost(author, { channel: channel._id, isArchived: true });
    await createCommunityReply(author, live._id, { isArchived: true });

    const res = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id) });

    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0].replies).toHaveLength(0);
    const ids = res.body.data.channels.map((c: { _id: string }) => c._id);
    expect(ids).not.toContain(String(archivedChannel._id));
  });

  it('lists pinned posts first, then newest first', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    const old = await createCommunityPost(author, {
      channel: channel._id,
      createdAt: new Date('2024-01-01'),
    });
    const fresh = await createCommunityPost(author, {
      channel: channel._id,
      createdAt: new Date('2025-01-01'),
    });
    const pinned = await createCommunityPost(author, {
      channel: channel._id,
      createdAt: new Date('2023-01-01'),
      isPinned: true,
      pinnedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id) });

    expect(res.body.data.posts.map((p: { _id: string }) => p._id)).toEqual([
      String(pinned._id),
      String(fresh._id),
      String(old._id),
    ]);
  });

  it('filters by search text and by date range', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    await createCommunityPost(author, {
      channel: channel._id,
      title: 'Quantum zebra',
      createdAt: new Date('2024-05-10T12:00:00Z'),
    });
    await createCommunityPost(author, {
      channel: channel._id,
      title: 'Other',
      description: 'nothing',
      createdAt: new Date('2022-01-10T12:00:00Z'),
    });

    const search = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id), search: 'ZEBRA' });
    expect(search.body.data.posts).toHaveLength(1);

    const range = await request(app)
      .get('/api/community')
      .query({ channel: String(channel._id), dateFrom: '2024-01-01', dateTo: '2024-12-31' });
    expect(range.body.data.posts).toHaveLength(1);
    expect(range.body.data.posts[0].title).toBe('Quantum zebra');
  });

  it('400 for an invalid date or a negative skip', async () => {
    expect((await request(app).get('/api/community').query({ dateFrom: 'nope' })).status).toBe(400);
    expect((await request(app).get('/api/community').query({ dateTo: 'nope' })).status).toBe(400);
    expect((await request(app).get('/api/community').query({ skip: -1 })).status).toBe(400);
  });

  it('400 (not 500) for a malformed channel id', async () => {
    const res = await request(app).get('/api/community').query({ channel: 'not-an-id' });
    expect(res.status).toBe(400);
  });

  it('does not answer 500 for a search text that is an invalid regular expression', async () => {
    const res = await request(app).get('/api/community').query({ search: '(' });
    expect(res.status).not.toBe(500);
  });

  it('matches the search text literally (regex characters are escaped)', async () => {
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    const plus = await createCommunityPost(author, {
      channel: channel._id,
      title: 'Learning C++ fast',
    });
    await createCommunityPost(author, { channel: channel._id, title: 'abc only' });

    const literal = await request(app).get('/api/community').query({ search: 'c++' });
    expect(literal.status).toBe(200);
    expect(literal.body.data.posts.map((p: { _id: string }) => p._id)).toEqual([String(plus._id)]);
    const dot = await request(app).get('/api/community').query({ search: 'a.c' });
    expect(dot.body.data.posts).toHaveLength(0);
  });

  it('archived=true: 403 for guests and non-admin roles, allowed for Super Admin and Admin', async () => {
    const users = await createUsersForAllRoles();
    const author = await createUser('Student');
    const channel = await createCommunityChannel();
    await createCommunityPost(author, { channel: channel._id, isArchived: true });
    await createCommunityPost(author, { channel: channel._id });

    expect((await request(app).get('/api/community').query({ archived: 'true' })).status).toBe(403);
    for (const role of ['Moderator', 'Teacher', 'Student'] as const) {
      const res = await request(app)
        .get('/api/community')
        .query({ archived: 'true' })
        .set('Cookie', authCookie(users[role]));
      expect(res.status).toBe(403);
    }
    for (const role of ['Super Admin', 'Admin'] as const) {
      const res = await request(app)
        .get('/api/community')
        .query({ archived: 'true', channel: String(channel._id) })
        .set('Cookie', authCookie(users[role]));
      expect(res.status).toBe(200);
      expect(res.body.data.posts).toHaveLength(1);
      expect(res.body.data.posts[0].isArchived).toBe(true);
    }
  });
});

describe('GET /api/community/users/:userId (profile)', () => {
  let owner: Awaited<ReturnType<typeof createUser>>;
  beforeEach(async () => {
    owner = await createUser('Student', { communityPoints: 50 });
  });

  it('returns the public profile with stats, badges, discussions and answers, without private fields', async () => {
    const other = await createUser('Student');
    const channel = await createCommunityChannel();
    const post = await createCommunityPost(owner, { channel: channel._id });
    const otherPost = await createCommunityPost(other, { channel: channel._id });
    const reply = await createCommunityReply(owner, otherPost._id);
    await createCommunityAnswerReply(owner, reply._id);
    await CommunityBadge.deleteMany({});
    await createCommunityBadge(other, { name: 'Low', requiredPoints: 10 });
    await createCommunityBadge(other, { name: 'High', requiredPoints: 500 });
    await createCommunityPost(owner, { channel: channel._id, isArchived: true });

    const res = await request(app).get(`/api/community/users/${owner._id}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.isPrivate).toBe(false);
    expect(data.user._id).toBe(String(owner._id));
    expect(data.user.email).toBeUndefined();
    expect(data.user.password).toBeUndefined();
    expect(data.stats).toMatchObject({ discussionsAsked: 1, answersGiven: 2 });
    expect(data.badges.map((b: { name: string }) => b.name)).toEqual(['Low']);
    expect(data.discussions.map((d: { _id: string }) => d._id)).toEqual([String(post._id)]);
    expect(data.answers).toHaveLength(2);
  });

  it('a private profile shows only name, avatar and role to guests and other users', async () => {
    const priv = await createUser('Student', {
      isCommunityProfilePrivate: true,
      communityPoints: 99,
    });
    const viewers = [
      await createUser('Student'),
      await createUser('Moderator'),
      await createUser('Teacher'),
    ];
    const responses = [
      await request(app).get(`/api/community/users/${priv._id}`),
      ...(await Promise.all(
        viewers.map((v) =>
          request(app).get(`/api/community/users/${priv._id}`).set('Cookie', authCookie(v)),
        ),
      )),
    ];
    for (const res of responses) {
      expect(res.status).toBe(200);
      expect(res.body.data.isPrivate).toBe(true);
      expect(res.body.data.stats).toBeUndefined();
      expect(res.body.data.discussions).toBeUndefined();
      expect(res.body.data.user.communityPoints).toBeUndefined();
      expect(res.body.data.user.email).toBeUndefined();
      expect(res.body.data.user.name).toBe(priv.name);
    }
  });

  it('a private profile is fully visible to its owner, Admin and Super Admin', async () => {
    const priv = await createUser('Student', { isCommunityProfilePrivate: true });
    const admin = await createUser('Admin');
    const superAdmin = await createUser('Super Admin');
    for (const viewer of [priv, admin, superAdmin]) {
      const res = await request(app)
        .get(`/api/community/users/${priv._id}`)
        .set('Cookie', authCookie(viewer));
      expect(res.body.data.isPrivate).toBe(false);
      expect(res.body.data.stats).toBeDefined();
    }
  });

  it('404 for an unknown user and 400 for a malformed id', async () => {
    expect((await request(app).get(`/api/community/users/${missingId()}`)).status).toBe(404);
    expect((await request(app).get('/api/community/users/nope')).status).toBe(400);
  });

  it('does not list answers whose discussion was archived', async () => {
    const other = await createUser('Student');
    const post = await createCommunityPost(other);
    await createCommunityReply(owner, post._id);
    await CommunityPost.updateOne({ _id: post._id }, { isArchived: true });

    const res = await request(app).get(`/api/community/users/${owner._id}`);
    expect(res.body.data.answers).toHaveLength(0);
    expect(res.body.data.stats.answersGiven).toBe(0);
  });
});

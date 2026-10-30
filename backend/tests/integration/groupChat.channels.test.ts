import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { GroupChatChannel } from '../../src/models/GroupChatChannel.model';
import { authCookie, bearer, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createGroupChannel } from '../factories/community';

describe('authentication on every group chat route', () => {
  it('401 without a token', async () => {
    const id = missingId();
    const calls = [
      request(app).get('/api/group-chat/channels'),
      request(app).get('/api/group-chat/channels/discover'),
      request(app).post('/api/group-chat/channels'),
      request(app).patch(`/api/group-chat/channels/${id}`),
      request(app).get('/api/group-chat/users/search'),
      request(app).post(`/api/group-chat/channels/${id}/join`),
      request(app).delete(`/api/group-chat/channels/${id}/join`),
      request(app).post(`/api/group-chat/channels/${id}/approve/${id}`),
      request(app).post(`/api/group-chat/channels/${id}/members`),
      request(app).delete(`/api/group-chat/channels/${id}/members/${id}`),
      request(app).post(`/api/group-chat/channels/${id}/leave`),
      request(app).patch(`/api/group-chat/channels/${id}/archive`),
      request(app).patch(`/api/group-chat/channels/${id}/block`),
      request(app).get(`/api/group-chat/channels/${id}/messages`),
      request(app).post(`/api/group-chat/channels/${id}/messages`),
      request(app).patch(`/api/group-chat/channels/${id}/read`),
    ];
    for (const res of await Promise.all(calls)) expect(res.status).toBe(401);
  });
});

describe('POST /api/group-chat/channels', () => {
  it('every role can create a channel; the creator becomes its only member and channel admin', async () => {
    const users = await createUsersForAllRoles();
    for (const user of Object.values(users)) {
      const res = await request(app)
        .post('/api/group-chat/channels')
        .set('Cookie', authCookie(user))
        .send({ name: `  ${user.role} room  `, description: ' hi ', type: 'Private' });
      expect(res.status, user.role).toBe(201);
      expect(res.body.data).toMatchObject({
        name: `${user.role} room`,
        description: 'hi',
        type: 'Private',
      });
      expect(res.body.data.creator._id).toBe(String(user._id));
      expect(res.body.data.members).toHaveLength(1);
      expect(res.body.data.members[0]).toMatchObject({ role: 'Admin', unreadCount: 0 });
      expect(res.body.data.members[0].user.email).toBeUndefined();
      expect(res.body.data.members[0].user.password).toBeUndefined();
      expect(res.body.data.isBlocked).toBe(false);
    }
  });

  it('accepts the Bearer header', async () => {
    const user = await createUser('Student');
    const res = await request(app)
      .post('/api/group-chat/channels')
      .set('Authorization', bearer(user))
      .send({ name: 'Bearer room', type: 'Public' });
    expect(res.status).toBe(201);
  });

  it('400 for a missing or blank name and for a missing or invalid type', async () => {
    const user = await createUser('Student');
    const post = (body: Record<string, unknown>) =>
      request(app).post('/api/group-chat/channels').set('Cookie', authCookie(user)).send(body);
    expect((await post({ type: 'Public' })).status).toBe(400);
    expect((await post({ name: '   ', type: 'Public' })).status).toBe(400);
    expect((await post({ name: 'x' })).status).toBe(400);
    expect((await post({ name: 'x', type: 'Secret' })).status).toBe(400);
  });

  it('answers 400 (not 500) when the name is not text', async () => {
    const user = await createUser('Student');
    const res = await request(app)
      .post('/api/group-chat/channels')
      .set('Cookie', authCookie(user))
      .send({ name: { $gt: '' }, type: 'Public' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/group-chat/channels/:channelId', () => {
  it('the creator, Super Admin, Admin and Moderator can update; saved in the database', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    for (const user of [creator, users['Super Admin'], users.Admin, users.Moderator]) {
      const res = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}`)
        .set('Cookie', authCookie(user))
        .send({ name: `Renamed by ${user.role}`, description: 'New', type: 'Private' });
      expect(res.status, user.role).toBe(200);
      expect(res.body.data).toMatchObject({ name: `Renamed by ${user.role}`, type: 'Private' });
    }
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.name).toBe('Renamed by Moderator');
  });

  it('403 for Teacher or Student who are not the creator, including plain members', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator, [users.Teacher, users.Student]);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}`)
        .set('Cookie', authCookie(users[role]))
        .send({ name: 'Hacked', type: 'Public' });
      expect(res.status, role).toBe(403);
    }
    expect((await GroupChatChannel.findById(channel._id).lean())?.name).toBe(channel.name);
  });

  it('400 for missing name or invalid type, 404 for unknown id, 400 for a malformed id', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const patch = (id: string, body: Record<string, unknown>) =>
      request(app)
        .patch(`/api/group-chat/channels/${id}`)
        .set('Cookie', authCookie(creator))
        .send(body);
    expect((await patch(String(channel._id), { type: 'Public' })).status).toBe(400);
    expect((await patch(String(channel._id), { name: 'x', type: 'Nope' })).status).toBe(400);
    expect((await patch(missingId(), { name: 'x', type: 'Public' })).status).toBe(404);
    expect((await patch('bad', { name: 'x', type: 'Public' })).status).toBe(400);
  });

  it('create and update answer 400 when name or description is not text', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    for (const body of [
      { name: { $gt: '' }, type: 'Public' },
      { name: ['a'], type: 'Public' },
      { name: 'ok', description: { a: 1 }, type: 'Public' },
    ]) {
      const created = await request(app)
        .post('/api/group-chat/channels')
        .set('Cookie', authCookie(creator))
        .send(body);
      expect(created.status, JSON.stringify(body)).toBe(400);
      const updated = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}`)
        .set('Cookie', authCookie(creator))
        .send(body);
      expect(updated.status, JSON.stringify(body)).toBe(400);
    }
    expect(await GroupChatChannel.countDocuments({ creator: creator._id })).toBe(1);
  });
});

describe('GET /api/group-chat/channels', () => {
  it('students see only channels they belong to, hiding archived and blocked ones', async () => {
    const me = await createUser('Student');
    const other = await createUser('Student');
    const mine = await createGroupChannel(other, [me]);
    await createGroupChannel(other, [me], { isArchived: true });
    await createGroupChannel(other, [me], { isBlocked: true });
    await createGroupChannel(other);

    const res = await request(app).get('/api/group-chat/channels').set('Cookie', authCookie(me));

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([String(mine._id)]);
  });

  it('sorts by latest message first and searches name and description', async () => {
    const me = await createUser('Student');
    const old = await createGroupChannel(me, [], {
      name: 'Old physics',
      lastMessageAt: new Date('2024-01-01'),
    });
    const fresh = await createGroupChannel(me, [], {
      name: 'Fresh',
      description: 'physics club',
      lastMessageAt: new Date('2025-01-01'),
    });
    await createGroupChannel(me, [], { name: 'Chemistry' });

    const res = await request(app)
      .get('/api/group-chat/channels')
      .query({ search: 'PHYSICS' })
      .set('Cookie', authCookie(me));
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([
      String(fresh._id),
      String(old._id),
    ]);
  });

  it('Super Admin, Admin and Moderator see every channel; archived=true shows only archived ones', async () => {
    const users = await createUsersForAllRoles();
    const owner = await createUser('Student');
    const live = await createGroupChannel(owner, [], { name: 'Staff-live' });
    const archived = await createGroupChannel(owner, [], {
      name: 'Staff-archived',
      isArchived: true,
    });
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const all = await request(app)
        .get('/api/group-chat/channels')
        .query({ search: 'Staff-' })
        .set('Cookie', authCookie(users[role]));
      expect(all.body.data.map((c: { _id: string }) => c._id).sort()).toEqual(
        [String(live._id), String(archived._id)].sort(),
      );
      const onlyArchived = await request(app)
        .get('/api/group-chat/channels')
        .query({ archived: 'true', search: 'Staff-' })
        .set('Cookie', authCookie(users[role]));
      expect(onlyArchived.body.data.map((c: { _id: string }) => c._id)).toEqual([
        String(archived._id),
      ]);
    }
  });

  it('a student passing archived=true still never sees archived channels', async () => {
    const me = await createUser('Student');
    await createGroupChannel(me, [], { isArchived: true });
    const res = await request(app)
      .get('/api/group-chat/channels')
      .query({ archived: 'true' })
      .set('Cookie', authCookie(me));
    expect(res.body.data).toHaveLength(0);
  });

  it('does not answer 500 for an invalid regular expression or a repeated search parameter', async () => {
    const me = await createUser('Student');
    const regex = await request(app)
      .get('/api/group-chat/channels')
      .query({ search: '(' })
      .set('Cookie', authCookie(me));
    expect(regex.status).not.toBe(500);
    const repeated = await request(app)
      .get('/api/group-chat/channels?search=a&search=b')
      .set('Cookie', authCookie(me));
    expect(repeated.status).not.toBe(500);
  });
});

describe('GET /api/group-chat/channels/discover', () => {
  it('lists public and private channels that are not archived or blocked, newest activity first, max 30', async () => {
    const me = await createUser('Student');
    const other = await createUser('Student');
    const pub = await createGroupChannel(other, [], {
      name: 'Disc-public',
      lastMessageAt: new Date('2025-02-01'),
    });
    const priv = await createGroupChannel(other, [], {
      name: 'Disc-private',
      type: 'Private',
      lastMessageAt: new Date('2025-01-01'),
    });
    await createGroupChannel(other, [], { name: 'Disc-archived', isArchived: true });
    await createGroupChannel(other, [], { name: 'Disc-blocked', isBlocked: true });

    const res = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'Disc-' })
      .set('Cookie', authCookie(me));

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([
      String(pub._id),
      String(priv._id),
    ]);
  });

  it('caps the list at 30 channels', async () => {
    const me = await createUser('Student');
    await Promise.all(
      Array.from({ length: 32 }, () => createGroupChannel(me, [], { name: 'Cap-room' })),
    );
    const res = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'Cap-room' })
      .set('Cookie', authCookie(me));
    expect(res.body.data).toHaveLength(30);
  });

  it('does not expose the member list or join requests of a private channel to non-members', async () => {
    const outsider = await createUser('Student');
    const creator = await createUser('Student');
    const requester = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { name: 'Secret-room', type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { user: requester._id } } },
    );

    const res = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'Secret-room' })
      .set('Cookie', authCookie(outsider));

    const found = res.body.data.find((c: { _id: string }) => c._id === String(channel._id));
    expect(found.members ?? []).toHaveLength(0);
    expect(found.joinRequests ?? []).toHaveLength(0);
    expect(found).toMatchObject({
      name: 'Secret-room',
      type: 'Private',
      memberCount: 1,
      hasPendingRequest: false,
    });
    expect(found.creator).toBeUndefined();

    const mine = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'Secret-room' })
      .set('Cookie', authCookie(requester));
    const pending = mine.body.data.find((c: { _id: string }) => c._id === String(channel._id));
    expect(pending.hasPendingRequest).toBe(true);
    expect(pending.joinRequests).toBeUndefined();

    const member = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'Secret-room' })
      .set('Cookie', authCookie(creator));
    expect(member.body.data[0].members).toHaveLength(1);
  });

  it('matches the search text literally (regex characters are escaped)', async () => {
    const me = await createUser('Student');
    const plus = await createGroupChannel(me, [], { name: 'Room C++' });
    await createGroupChannel(me, [], { name: 'Room abc' });
    const res = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: 'c++' })
      .set('Cookie', authCookie(me));
    expect(res.body.data.map((c: { _id: string }) => c._id)).toEqual([String(plus._id)]);
    const dot = await request(app)
      .get('/api/group-chat/channels')
      .query({ search: 'room a.c' })
      .set('Cookie', authCookie(me));
    expect(dot.body.data).toHaveLength(0);
  });

  it('does not answer 500 for an invalid regular expression', async () => {
    const me = await createUser('Student');
    const res = await request(app)
      .get('/api/group-chat/channels/discover')
      .query({ search: '[' })
      .set('Cookie', authCookie(me));
    expect(res.status).not.toBe(500);
  });
});

describe('GET /api/group-chat/users/search', () => {
  it('returns an empty list for an empty search, never the caller, and at most 20 users', async () => {
    const me = await createUser('Student', { name: 'Searchable Me' });
    await Promise.all(
      Array.from({ length: 22 }, () => createUser('Student', { name: 'Searchable person' })),
    );
    const empty = await request(app)
      .get('/api/group-chat/users/search')
      .set('Cookie', authCookie(me));
    expect(empty.body).toEqual({ success: true, data: [] });

    const res = await request(app)
      .get('/api/group-chat/users/search')
      .query({ search: 'searchable' })
      .set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.data.map((u: { _id: string }) => u._id)).not.toContain(String(me._id));
    for (const u of res.body.data) {
      expect(u.password).toBeUndefined();
      expect(Object.keys(u).sort()).toEqual(expect.arrayContaining(['_id', 'name', 'role']));
    }
  });

  it('matches by name; does not let a Student look up other users by email address', async () => {
    const me = await createUser('Student');
    const target = await createUser('Teacher', {
      name: 'Zed Unique',
      email: 'zed.unique.private@example.com',
    });
    const byName = await request(app)
      .get('/api/group-chat/users/search')
      .query({ search: 'zed unique' })
      .set('Cookie', authCookie(me));
    expect(byName.body.data.map((u: { _id: string }) => u._id)).toEqual([String(target._id)]);

    const byEmail = await request(app)
      .get('/api/group-chat/users/search')
      .query({ search: 'zed.unique.private' })
      .set('Cookie', authCookie(me));
    expect(byEmail.body.data).toHaveLength(0);
    expect(byName.body.data[0]).not.toHaveProperty('email');
  });

  it('includes the email only for platform staff', async () => {
    const target = await createUser('Student', { name: 'Ysolde Staffcheck' });
    for (const role of ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'] as const) {
      const caller = await createUser(role);
      const res = await request(app)
        .get('/api/group-chat/users/search')
        .query({ search: 'ysolde staffcheck' })
        .set('Cookie', authCookie(caller));
      expect(res.body.data, role).toHaveLength(1);
      if (role === 'Teacher' || role === 'Student') {
        expect(res.body.data[0], role).not.toHaveProperty('email');
      } else {
        expect(res.body.data[0].email, role).toBe(target.email);
      }
    }
  });

  it('does not answer 500 for an invalid regular expression', async () => {
    const me = await createUser('Student');
    const res = await request(app)
      .get('/api/group-chat/users/search')
      .query({ search: '(' })
      .set('Cookie', authCookie(me));
    expect(res.status).not.toBe(500);
  });
});

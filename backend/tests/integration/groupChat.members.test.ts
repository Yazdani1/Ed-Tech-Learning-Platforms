import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { GroupChatChannel } from '../../src/models/GroupChatChannel.model';
import { authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createGroupChannel } from '../factories/community';

const memberIds = async (channelId: unknown) =>
  ((await GroupChatChannel.findById(channelId).lean())?.members ?? []).map((m) => String(m.user));

describe('POST /api/group-chat/channels/:channelId/join', () => {
  it('joins a public channel at once as a Member (every role)', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    for (const user of Object.values(users)) {
      const res = await request(app)
        .post(`/api/group-chat/channels/${channel._id}/join`)
        .set('Cookie', authCookie(user));
      expect(res.status, user.role).toBe(200);
      expect(res.body.message).toBe('Joined channel');
    }
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.members).toHaveLength(6);
    expect(
      saved?.members.every(
        (m) =>
          m.user &&
          (String(m.user) === String(creator._id) ? m.role === 'Admin' : m.role === 'Member'),
      ),
    ).toBe(true);
  });

  it('joining twice answers "Already a member" without a duplicate', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [user]);
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/join`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Already a member');
    expect(await memberIds(channel._id)).toHaveLength(2);
  });

  it('a private channel records one Pending request (no duplicate) and does not add the member', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    for (let i = 0; i < 2; i += 1) {
      const res = await request(app)
        .post(`/api/group-chat/channels/${channel._id}/join`)
        .set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Join request sent');
    }
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.joinRequests).toHaveLength(1);
    expect(saved?.joinRequests[0]).toMatchObject({ status: 'Pending' });
    expect(String(saved?.joinRequests[0].user)).toBe(String(user._id));
    expect(await memberIds(channel._id)).not.toContain(String(user._id));
  });

  it('SECURITY: the join-request response is the public card (no members, no other requests)', async () => {
    const creator = await createUser('Student');
    const other = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { user: other._id } } },
    );
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/join`)
      .set('Cookie', authCookie(user));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      _id: String(channel._id),
      name: channel.name,
      type: 'Private',
      memberCount: 1,
      hasPendingRequest: true,
    });
    expect(res.body.data).not.toHaveProperty('members');
    expect(res.body.data).not.toHaveProperty('joinRequests');
    expect(JSON.stringify(res.body)).not.toContain(String(other._id));
    expect(JSON.stringify(res.body)).not.toContain(String(creator._id));
  });

  it('404 for a missing, archived or blocked channel; 400 for a malformed id', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const archived = await createGroupChannel(creator, [], { isArchived: true });
    const blocked = await createGroupChannel(creator, [], { isBlocked: true });
    const join = (id: unknown) =>
      request(app).post(`/api/group-chat/channels/${id}/join`).set('Cookie', authCookie(user));
    expect((await join(missingId())).status).toBe(404);
    expect((await join(archived._id)).status).toBe(404);
    expect((await join(blocked._id)).status).toBe(404);
    expect((await join('bad')).status).toBe(400);
  });
});

describe('DELETE /api/group-chat/channels/:channelId/join (cancel request)', () => {
  it('removes the caller own pending request only', async () => {
    const creator = await createUser('Student');
    const a = await createUser('Student');
    const b = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { $each: [{ user: a._id }, { user: b._id }] } } },
    );

    const res = await request(app)
      .delete(`/api/group-chat/channels/${channel._id}/join`)
      .set('Cookie', authCookie(a));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Join request cancelled');
    expect(res.body.data).toMatchObject({ _id: String(channel._id), hasPendingRequest: false });
    expect(res.body.data).not.toHaveProperty('members');
    expect(res.body.data).not.toHaveProperty('joinRequests');
    expect(JSON.stringify(res.body)).not.toContain(String(b._id));
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.joinRequests.map((r) => String(r.user))).toEqual([String(b._id)]);
  });

  it('404 without a pending request, 400 for a member, 404 for missing / archived / blocked, 400 malformed id', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    const archived = await createGroupChannel(creator, [], { isArchived: true });
    const del = (id: unknown, who = user) =>
      request(app).delete(`/api/group-chat/channels/${id}/join`).set('Cookie', authCookie(who));
    expect((await del(channel._id)).status).toBe(404);
    expect((await del(channel._id, creator)).status).toBe(400);
    expect((await del(missingId())).status).toBe(404);
    expect((await del(archived._id)).status).toBe(404);
    expect((await del('bad')).status).toBe(400);
  });
});

describe('POST /api/group-chat/channels/:channelId/approve/:userId', () => {
  it('the channel admin approves a pending request: status Approved, user becomes a Member', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { user: user._id } } },
    );

    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/approve/${user._id}`)
      .set('Cookie', authCookie(creator));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Join request approved');
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.joinRequests[0].status).toBe('Approved');
    expect(saved?.joinRequests[0].respondedAt).toBeTruthy();
    expect(await memberIds(channel._id)).toContain(String(user._id));
  });

  it('platform staff can approve; plain members, outsiders and Teachers cannot (403)', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const requester = await createUser('Student');
    const channel = await createGroupChannel(creator, [users.Student], { type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { user: requester._id } } },
    );
    const approve = (who: typeof creator) =>
      request(app)
        .post(`/api/group-chat/channels/${channel._id}/approve/${requester._id}`)
        .set('Cookie', authCookie(who));

    expect((await approve(users.Student)).status).toBe(403);
    expect((await approve(users.Teacher)).status).toBe(403);
    expect((await approve(users.Moderator)).status).toBe(200);
  });

  it('404 without a pending request (also a second approval), missing channel; 400 malformed ids', async () => {
    const creator = await createUser('Student');
    const user = await createUser('Student');
    const channel = await createGroupChannel(creator, [], { type: 'Private' });
    await GroupChatChannel.updateOne(
      { _id: channel._id },
      { $push: { joinRequests: { user: user._id } } },
    );
    const approve = (c: unknown, u: unknown) =>
      request(app)
        .post(`/api/group-chat/channels/${c}/approve/${u}`)
        .set('Cookie', authCookie(creator));
    expect((await approve(channel._id, missingId())).status).toBe(404);
    expect((await approve(channel._id, user._id)).status).toBe(200);
    expect((await approve(channel._id, user._id)).status).toBe(404);
    expect((await approve(missingId(), user._id)).status).toBe(404);
    expect((await approve('bad', user._id)).status).toBe(400);
    expect((await approve(channel._id, 'bad')).status).toBe(404);
  });
});

describe('POST /api/group-chat/channels/:channelId/members (add)', () => {
  it('a channel admin adds users as Members; existing members and duplicates are skipped', async () => {
    const creator = await createUser('Student');
    const a = await createUser('Student');
    const b = await createUser('Student');
    const channel = await createGroupChannel(creator, [a]);
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/members`)
      .set('Cookie', authCookie(creator))
      .send({ userIds: [String(a._id), String(b._id), String(creator._id)] });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Members added');
    expect((await memberIds(channel._id)).sort()).toEqual(
      [String(creator._id), String(a._id), String(b._id)].sort(),
    );
    expect(res.body.data.members).toHaveLength(3);
  });

  it('403 for a plain member, an outsider and a Teacher; staff may add', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const target = await createUser('Student');
    const channel = await createGroupChannel(creator, [users.Student]);
    const add = (who: typeof creator) =>
      request(app)
        .post(`/api/group-chat/channels/${channel._id}/members`)
        .set('Cookie', authCookie(who))
        .send({ userIds: [String(target._id)] });
    expect((await add(users.Student)).status).toBe(403);
    expect((await add(users.Teacher)).status).toBe(403);
    expect(await memberIds(channel._id)).not.toContain(String(target._id));
    expect((await add(users.Admin)).status).toBe(200);
  });

  it('400 for no users or a non-array; 404 for a missing channel; 400 malformed id', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const add = (id: unknown, userIds: unknown) =>
      request(app)
        .post(`/api/group-chat/channels/${id}/members`)
        .set('Cookie', authCookie(creator))
        .send({ userIds });
    expect((await add(channel._id, [])).status).toBe(400);
    expect((await add(channel._id, 'x')).status).toBe(400);
    expect((await add(channel._id, undefined)).status).toBe(400);
    expect((await add(missingId(), [String(creator._id)])).status).toBe(404);
    expect((await add('bad', [String(creator._id)])).status).toBe(400);
  });

  it('only adds ids of users that exist (an unknown id never becomes a member)', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const real = await createUser('Student');
    const ghost = missingId();
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/members`)
      .set('Cookie', authCookie(creator))
      .send({ userIds: [String(real._id), ghost] });
    expect(res.status).toBe(400);
    expect(await memberIds(channel._id)).toEqual([String(creator._id)]);
  });

  it('400 for a malformed or non-text id; a repeated id is added once', async () => {
    const creator = await createUser('Student');
    const target = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const add = (userIds: unknown) =>
      request(app)
        .post(`/api/group-chat/channels/${channel._id}/members`)
        .set('Cookie', authCookie(creator))
        .send({ userIds });
    expect((await add(['bad'])).status).toBe(400);
    expect((await add([{ $ne: null }])).status).toBe(400);
    const res = await add([String(target._id), String(target._id)]);
    expect(res.status).toBe(200);
    expect(await memberIds(channel._id)).toEqual([String(creator._id), String(target._id)]);
  });
});

describe('DELETE /api/group-chat/channels/:channelId/members/:userId', () => {
  it('a channel admin removes a member; the creator cannot be removed (400)', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Student');
    const channel = await createGroupChannel(creator, [member]);
    const del = (u: unknown, who = creator) =>
      request(app)
        .delete(`/api/group-chat/channels/${channel._id}/members/${u}`)
        .set('Cookie', authCookie(who));

    expect((await del(creator._id)).status).toBe(400);
    const res = await del(member._id);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Member removed');
    expect(await memberIds(channel._id)).toEqual([String(creator._id)]);
  });

  it('403 for a plain member and an outsider; staff can remove', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const victim = await createUser('Student');
    const channel = await createGroupChannel(creator, [users.Student, victim]);
    const del = (who: typeof creator) =>
      request(app)
        .delete(`/api/group-chat/channels/${channel._id}/members/${victim._id}`)
        .set('Cookie', authCookie(who));
    expect((await del(users.Student)).status).toBe(403);
    expect((await del(users.Teacher)).status).toBe(403);
    expect((await del(users.Moderator)).status).toBe(200);
  });

  it('404 for a missing channel, 400 for a malformed channel id', async () => {
    const creator = await createUser('Student');
    const del = (c: unknown) =>
      request(app)
        .delete(`/api/group-chat/channels/${c}/members/${missingId()}`)
        .set('Cookie', authCookie(creator));
    expect((await del(missingId())).status).toBe(404);
    expect((await del('bad')).status).toBe(400);
  });
});

describe('POST /api/group-chat/channels/:channelId/leave', () => {
  it('a member leaves (removed from the list); the creator cannot leave (400)', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Student');
    const channel = await createGroupChannel(creator, [member]);
    const leave = (who: typeof creator) =>
      request(app)
        .post(`/api/group-chat/channels/${channel._id}/leave`)
        .set('Cookie', authCookie(who));
    expect((await leave(creator)).status).toBe(400);
    const res = await leave(member);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Left channel' });
    expect(await memberIds(channel._id)).toEqual([String(creator._id)]);
  });

  it('404 / 400 for missing or malformed id', async () => {
    const user = await createUser('Student');
    expect(
      (
        await request(app)
          .post(`/api/group-chat/channels/${missingId()}/leave`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .post('/api/group-chat/channels/bad/leave')
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(400);
  });
});

describe('PATCH /api/group-chat/channels/:channelId/archive', () => {
  it('the creator and staff archive; a plain member, outsider or Teacher get 403', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const archive = (id: unknown, who: typeof creator) =>
      request(app).patch(`/api/group-chat/channels/${id}/archive`).set('Cookie', authCookie(who));
    const guarded = await createGroupChannel(creator, [users.Student, users.Teacher]);
    expect((await archive(guarded._id, users.Student)).status).toBe(403);
    expect((await archive(guarded._id, users.Teacher)).status).toBe(403);
    expect((await GroupChatChannel.findById(guarded._id).lean())?.isArchived).toBe(false);

    for (const who of [creator, users['Super Admin'], users.Admin, users.Moderator]) {
      const channel = await createGroupChannel(creator);
      const res = await archive(channel._id, who);
      expect(res.status, who.role).toBe(200);
      expect(res.body.data.isArchived).toBe(true);
      expect((await GroupChatChannel.findById(channel._id).lean())?.isArchived).toBe(true);
    }
  });

  it('404 / 400 for missing or malformed id', async () => {
    const user = await createUser('Admin');
    expect(
      (
        await request(app)
          .patch(`/api/group-chat/channels/${missingId()}/archive`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/group-chat/channels/bad/archive')
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(400);
  });
});

describe('PATCH /api/group-chat/channels/:channelId/block', () => {
  it('Super Admin, Admin and Moderator toggle the block; the channel disappears for members', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const channel = await createGroupChannel(creator);
      const on = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}/block`)
        .set('Cookie', authCookie(users[role]));
      expect(on.status, role).toBe(200);
      expect(on.body.message).toBe('Channel blocked');
      expect(on.body.data.isBlocked).toBe(true);
      const list = await request(app)
        .get('/api/group-chat/channels')
        .set('Cookie', authCookie(creator));
      expect(list.body.data.map((c: { _id: string }) => c._id)).not.toContain(String(channel._id));
      const off = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}/block`)
        .set('Cookie', authCookie(users[role]));
      expect(off.body.message).toBe('Channel unblocked');
      expect((await GroupChatChannel.findById(channel._id).lean())?.isBlocked).toBe(false);
    }
  });

  it('403 for Teacher and Student, even the channel creator', async () => {
    const users = await createUsersForAllRoles();
    const channel = await createGroupChannel(users.Student, [users.Teacher]);
    for (const role of ['Teacher', 'Student'] as const) {
      const res = await request(app)
        .patch(`/api/group-chat/channels/${channel._id}/block`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(403);
    }
    expect((await GroupChatChannel.findById(channel._id).lean())?.isBlocked).toBe(false);
  });

  it('404 / 400 for missing or malformed id', async () => {
    const user = await createUser('Moderator');
    expect(
      (
        await request(app)
          .patch(`/api/group-chat/channels/${missingId()}/block`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch('/api/group-chat/channels/bad/block')
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(400);
  });
});

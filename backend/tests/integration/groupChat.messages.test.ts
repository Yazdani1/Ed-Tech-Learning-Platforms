import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { GroupChatChannel } from '../../src/models/GroupChatChannel.model';
import { GroupChatMessage } from '../../src/models/GroupChatMessage.model';
import { PNG_BYTES, authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createGroupChannel } from '../factories/community';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => vi.restoreAllMocks());

const send = (channelId: unknown, who: Awaited<ReturnType<typeof createUser>>, content?: unknown) =>
  request(app)
    .post(`/api/group-chat/channels/${channelId}/messages`)
    .set('Cookie', authCookie(who))
    .send({ content });

describe('POST /api/group-chat/channels/:channelId/messages', () => {
  it('a member sends a text message: 201, sender details from the account, unread counters and last message updated', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Teacher', { avatar: 'https://x/a.png' });
    const channel = await createGroupChannel(creator, [member]);

    const res = await send(channel._id, member, '  Hello team  ');

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Message sent');
    expect(res.body.data).toMatchObject({
      content: 'Hello team',
      sender: String(member._id),
      senderName: member.name,
      senderRole: 'Teacher',
      senderAvatar: 'https://x/a.png',
      attachments: [],
    });
    const saved = await GroupChatChannel.findById(channel._id).lean();
    expect(saved?.lastMessage).toBe('Hello team');
    const unread = Object.fromEntries(
      (saved?.members ?? []).map((m) => [String(m.user), m.unreadCount]),
    );
    expect(unread[String(creator._id)]).toBe(1);
    expect(unread[String(member._id)]).toBe(0);
    expect(await GroupChatMessage.countDocuments({ channel: channel._id })).toBe(1);
  });

  it('the sender cannot be faked through the body', async () => {
    const creator = await createUser('Student');
    const other = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator))
      .send({
        content: 'hi',
        sender: String(other._id),
        senderName: 'Boss',
        senderRole: 'Super Admin',
      });
    expect(res.body.data.sender).toBe(String(creator._id));
    expect(res.body.data.senderRole).toBe('Student');
  });

  it('uploads files (multipart) through Cloudinary and stores attachment details; last message is the file name', async () => {
    const cloud = mockCloudinary();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator))
      .attach('files', PNG_BYTES, { filename: 'diagram.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(cloud.upload).toHaveBeenCalledTimes(1);
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0]).toMatchObject({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      size: PNG_BYTES.length,
    });
    expect(res.body.data.attachments[0].url).toContain('medhabee/group-chat');
    expect((await GroupChatChannel.findById(channel._id).lean())?.lastMessage).toBe('diagram.png');
  });

  it('more than 10 files is 400 (not 500)', async () => {
    mockCloudinary();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const file = { filename: 'a.png', contentType: 'image/png' };
    let req = request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator));
    for (let i = 0; i < 11; i += 1) req = req.attach('files', PNG_BYTES, file);
    expect((await req).status).toBe(400);
  });

  it('several files give "<n> files" as the last message', async () => {
    mockCloudinary();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const file = { filename: 'a.png', contentType: 'image/png' };
    const two = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator))
      .attach('files', PNG_BYTES, file)
      .attach('files', PNG_BYTES, file);
    expect(two.status).toBe(201);
    expect((await GroupChatChannel.findById(channel._id).lean())?.lastMessage).toBe('2 files');
  });

  it('rejects files that are not safe attachments (executables, scripts, HTML)', async () => {
    const cloud = mockCloudinary();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const res = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator))
      .attach('files', Buffer.from('<script>alert(1)</script>'), {
        filename: 'x.html',
        contentType: 'text/html',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('This file type is not allowed');

    const mixed = await request(app)
      .post(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator))
      .attach('files', PNG_BYTES, { filename: 'ok.png', contentType: 'image/png' })
      .attach('files', Buffer.from([0x4d, 0x5a, 0x90, 0x00]), {
        filename: 'photo.png',
        contentType: 'image/png',
      });
    expect(mixed.status).toBe(400);
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(await GroupChatMessage.countDocuments({ channel: channel._id })).toBe(0);
  });

  it('400 when there is neither text nor file', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    expect((await send(channel._id, creator, '   ')).status).toBe(400);
    expect((await send(channel._id, creator, undefined)).status).toBe(400);
  });

  it('members-only: outsiders, Teachers and Students who are not members get 403 and nothing is saved', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    for (const role of ['Teacher', 'Student'] as const) {
      expect((await send(channel._id, users[role], 'let me in')).status, role).toBe(403);
    }
    expect(await GroupChatMessage.countDocuments({ channel: channel._id })).toBe(0);
  });

  it('a member of an archived or blocked channel gets 403', async () => {
    const creator = await createUser('Student');
    const archived = await createGroupChannel(creator, [], { isArchived: true });
    const blocked = await createGroupChannel(creator, [], { isBlocked: true });
    expect((await send(archived._id, creator, 'x')).status).toBe(403);
    expect((await send(blocked._id, creator, 'x')).status).toBe(403);
  });

  it('platform staff cannot post into a blocked channel', async () => {
    const admin = await createUser('Admin');
    const creator = await createUser('Student');
    const blocked = await createGroupChannel(creator, [], { isBlocked: true });
    expect((await send(blocked._id, admin, 'x')).status).toBe(403);
  });

  it('404 for a missing channel, 400 for a malformed id', async () => {
    const user = await createUser('Student');
    expect((await send(missingId(), user, 'x')).status).toBe(404);
    expect((await send('bad', user, 'x')).status).toBe(400);
  });

  it('answers 400 (not 500) when content is an object', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const res = await send(channel._id, creator, { $gt: '' });
    expect(res.status).toBe(400);
    expect((await send(channel._id, creator, ['a', 'b'])).status).toBe(400);
    expect(await GroupChatMessage.countDocuments({ channel: channel._id })).toBe(0);
  });
});

describe('GET /api/group-chat/channels/:channelId/messages', () => {
  it('members get the messages oldest first', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Student');
    const channel = await createGroupChannel(creator, [member]);
    await GroupChatMessage.create([
      {
        channel: channel._id,
        sender: creator._id,
        senderName: 'a',
        senderRole: 'Student',
        content: 'second',
        createdAt: new Date('2025-01-02'),
      },
      {
        channel: channel._id,
        sender: creator._id,
        senderName: 'a',
        senderRole: 'Student',
        content: 'first',
        createdAt: new Date('2025-01-01'),
      },
    ]);
    const other = await createGroupChannel(creator);
    await GroupChatMessage.create({
      channel: other._id,
      sender: creator._id,
      senderName: 'a',
      senderRole: 'Student',
      content: 'elsewhere',
    });

    const res = await request(app)
      .get(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(member));

    expect(res.status).toBe(200);
    expect(res.body.data.map((m: { content: string }) => m.content)).toEqual(['first', 'second']);
  });

  it('403 for non-members (Teacher, Student) and for members of archived or blocked channels', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const archived = await createGroupChannel(creator, [], { isArchived: true });
    const blocked = await createGroupChannel(creator, [], { isBlocked: true });
    const get = (id: unknown, who: typeof creator) =>
      request(app).get(`/api/group-chat/channels/${id}/messages`).set('Cookie', authCookie(who));
    for (const role of ['Teacher', 'Student'] as const)
      expect((await get(channel._id, users[role])).status, role).toBe(403);
    expect((await get(archived._id, creator)).status).toBe(403);
    expect((await get(blocked._id, creator)).status).toBe(403);
  });

  it('staff can read any channel, including archived ones', async () => {
    const users = await createUsersForAllRoles();
    const creator = await createUser('Student');
    const archived = await createGroupChannel(creator, [], { isArchived: true });
    for (const role of ['Super Admin', 'Admin', 'Moderator'] as const) {
      const res = await request(app)
        .get(`/api/group-chat/channels/${archived._id}/messages`)
        .set('Cookie', authCookie(users[role]));
      expect(res.status, role).toBe(200);
    }
  });

  it('returns at most 200 messages', async () => {
    const creator = await createUser('Student');
    const channel = await createGroupChannel(creator);
    await GroupChatMessage.insertMany(
      Array.from({ length: 205 }, (_, i) => ({
        channel: channel._id,
        sender: creator._id,
        senderName: 'a',
        senderRole: 'Student',
        content: `m${i}`,
      })),
    );
    const res = await request(app)
      .get(`/api/group-chat/channels/${channel._id}/messages`)
      .set('Cookie', authCookie(creator));
    expect(res.body.data).toHaveLength(200);
  });

  it('404 / 400 for missing or malformed id', async () => {
    const user = await createUser('Student');
    expect(
      (
        await request(app)
          .get(`/api/group-chat/channels/${missingId()}/messages`)
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get('/api/group-chat/channels/bad/messages')
          .set('Cookie', authCookie(user))
      ).status,
    ).toBe(400);
  });
});

describe('PATCH /api/group-chat/channels/:channelId/read', () => {
  it('resets only the caller unread counter', async () => {
    const creator = await createUser('Student');
    const member = await createUser('Student');
    const channel = await createGroupChannel(creator, [member]);
    await send(channel._id, creator, 'one');
    await send(channel._id, member, 'two');

    const res = await request(app)
      .patch(`/api/group-chat/channels/${channel._id}/read`)
      .set('Cookie', authCookie(member));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const unread = Object.fromEntries(
      ((await GroupChatChannel.findById(channel._id).lean())?.members ?? []).map((m) => [
        String(m.user),
        m.unreadCount,
      ]),
    );
    expect(unread[String(member._id)]).toBe(0);
    expect(unread[String(creator._id)]).toBe(1);
  });

  it('403 for non-members, 404 / 400 for missing or malformed id', async () => {
    const creator = await createUser('Student');
    const outsider = await createUser('Student');
    const channel = await createGroupChannel(creator);
    const read = (id: unknown, who = outsider) =>
      request(app).patch(`/api/group-chat/channels/${id}/read`).set('Cookie', authCookie(who));
    expect((await read(channel._id)).status).toBe(403);
    expect((await read(missingId())).status).toBe(404);
    expect((await read('bad')).status).toBe(400);
  });
});

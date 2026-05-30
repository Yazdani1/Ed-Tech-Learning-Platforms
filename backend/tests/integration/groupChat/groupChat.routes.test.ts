import request from 'supertest';
import app from '../../../src/app';
import { GroupChatChannel } from '../../../src/models/GroupChatChannel.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Group Chat API', () => {
  it('creates, discovers, joins, messages, reads, updates, archives, and blocks public channels', async () => {
    const creator = await createTestUser({ role: 'Student', email: 'creator@example.com' });
    const member = await createTestUser({ role: 'Student', email: 'member@example.com' });
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const create = await request(app).post('/api/group-chat/channels').set(authHeaderFor(creator)).send({
      name: 'Study Room',
      description: 'Discuss lessons',
      type: 'Public',
    });
    expectSuccess(create, 201);

    const discover = await request(app).get('/api/group-chat/channels/discover?search=Study').set(authHeaderFor(member));
    expectSuccess(discover);
    expect(discover.body.data).toHaveLength(1);

    const join = await request(app).post(`/api/group-chat/channels/${create.body.data._id}/join`).set(authHeaderFor(member));
    expectSuccess(join);
    expect(join.body.message).toBe('Joined channel');

    const message = await request(app)
      .post(`/api/group-chat/channels/${create.body.data._id}/messages`)
      .set(authHeaderFor(member))
      .field('content', 'Hello group')
      .attach('files', Buffer.from('file'), { filename: 'note.txt', contentType: 'text/plain' });
    expectSuccess(message, 201);
    expect(message.body.data.attachments).toHaveLength(1);

    const messages = await request(app).get(`/api/group-chat/channels/${create.body.data._id}/messages`).set(authHeaderFor(creator));
    expectSuccess(messages);
    expect(messages.body.data).toHaveLength(1);

    const read = await request(app).patch(`/api/group-chat/channels/${create.body.data._id}/read`).set(authHeaderFor(creator));
    expectSuccess(read);

    const update = await request(app).patch(`/api/group-chat/channels/${create.body.data._id}`).set(authHeaderFor(creator)).send({
      name: 'Updated Room',
      type: 'Private',
    });
    expectSuccess(update);
    expect(update.body.data.name).toBe('Updated Room');

    const block = await request(app).patch(`/api/group-chat/channels/${create.body.data._id}/block`).set(authHeaderFor(admin));
    expectSuccess(block);

    const archive = await request(app).patch(`/api/group-chat/channels/${create.body.data._id}/archive`).set(authHeaderFor(admin));
    expectSuccess(archive);
  });

  it('handles private channel join requests, approval, member management, leave, and search users', async () => {
    const creator = await createTestUser({ role: 'Student', email: 'creator@example.com', name: 'Creator' });
    const requester = await createTestUser({ role: 'Student', email: 'requester@example.com', name: 'Requester' });
    const added = await createTestUser({ role: 'Student', email: 'added@example.com', name: 'Added User' });

    const create = await request(app).post('/api/group-chat/channels').set(authHeaderFor(creator)).send({ name: 'Private Room', type: 'Private' });
    expectSuccess(create, 201);

    const requestJoin = await request(app).post(`/api/group-chat/channels/${create.body.data._id}/join`).set(authHeaderFor(requester));
    expectSuccess(requestJoin);
    expect(requestJoin.body.message).toBe('Join request sent');

    const approve = await request(app).post(`/api/group-chat/channels/${create.body.data._id}/approve/${requester._id}`).set(authHeaderFor(creator));
    expectSuccess(approve);

    const add = await request(app).post(`/api/group-chat/channels/${create.body.data._id}/members`).set(authHeaderFor(creator)).send({ userIds: [String(added._id)] });
    expectSuccess(add);

    const remove = await request(app).delete(`/api/group-chat/channels/${create.body.data._id}/members/${added._id}`).set(authHeaderFor(creator));
    expectSuccess(remove);

    const leave = await request(app).post(`/api/group-chat/channels/${create.body.data._id}/leave`).set(authHeaderFor(requester));
    expectSuccess(leave);

    const search = await request(app).get('/api/group-chat/users/search?search=Added').set(authHeaderFor(creator));
    expectSuccess(search);
    expect(search.body.data[0].email).toBe('added@example.com');
  });

  it('validates group chat payloads, access, and missing records', async () => {
    const creator = await createTestUser({ role: 'Student', email: 'creator@example.com' });
    const outsider = await createTestUser({ role: 'Student', email: 'outsider@example.com' });
    const channel = await GroupChatChannel.create({
      name: 'Locked',
      type: 'Private',
      creator: creator._id,
      members: [{ user: creator._id, role: 'Admin', unreadCount: 0, joinedAt: new Date() }],
    });

    const missingName = await request(app).post('/api/group-chat/channels').set(authHeaderFor(creator)).send({ type: 'Public' });
    expectError(missingName, 400, /Channel name is required/);

    const missingType = await request(app).post('/api/group-chat/channels').set(authHeaderFor(creator)).send({ name: 'Bad' });
    expectError(missingType, 400, /Channel type is required/);

    const blockedMessage = await request(app).post(`/api/group-chat/channels/${channel._id}/messages`).set(authHeaderFor(outsider)).send({ content: 'Nope' });
    expectError(blockedMessage, 403, /not a member/);

    const emptyMessage = await request(app).post(`/api/group-chat/channels/${channel._id}/messages`).set(authHeaderFor(creator)).send({});
    expectError(emptyMessage, 400, /Message or file is required/);

    const badAdd = await request(app).post(`/api/group-chat/channels/${channel._id}/members`).set(authHeaderFor(creator)).send({ userIds: [] });
    expectError(badAdd, 400, /Select at least one user/);

    const creatorLeave = await request(app).post(`/api/group-chat/channels/${channel._id}/leave`).set(authHeaderFor(creator));
    expectError(creatorLeave, 400, /creator cannot leave/);

    const missing = await request(app).get(`/api/group-chat/channels/${makeObjectId()}/messages`).set(authHeaderFor(creator));
    expectError(missing, 404, /Channel not found/);
  });
});

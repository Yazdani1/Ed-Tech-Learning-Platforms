import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { ChatConversation } from '../../src/models/ChatConversation.model';
import {
  authCookie,
  bearer,
  createUser,
  createUsersForAllRoles,
  missingId,
  ROLES,
} from '../factories';
import { createChatMessage, createConversation, daysAgo } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const CONVERSATIONS = '/api/chat/conversations';
// The controller treats these roles as staff (Teacher included).
const STAFF: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Teacher'];

let users: Record<UserRole, IUser>;
let alice: IUser;
let bob: IUser;
let aliceConv: Awaited<ReturnType<typeof createConversation>>;
let bobConv: Awaited<ReturnType<typeof createConversation>>;

beforeAll(async () => {
  users = await createUsersForAllRoles();
  alice = await createUser('Student', { name: 'Alice' });
  bob = await createUser('Student', { name: 'Bob' });
  aliceConv = await createConversation(alice, { lastMessageAt: daysAgo(2) });
  bobConv = await createConversation(bob, { lastMessageAt: daysAgo(1) });
  await createChatMessage(aliceConv._id, alice, 'second', daysAgo(1));
  await createChatMessage(aliceConv._id, alice, 'first', daysAgo(2));
  await createChatMessage(aliceConv._id, users.Admin, 'third', new Date());
  await createChatMessage(bobConv._id, bob, 'bob secret');
});

describe('GET /api/chat/conversations', () => {
  it('401 without a token', async () => {
    const res = await request(app).get(CONVERSATIONS);
    expect(res.status).toBe(401);
  });

  it.each(STAFF)('%s sees every conversation, most recent activity first', async (role) => {
    const res = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.data.map((c: { student: { name: string } }) => c.student.name);
    expect(names).toEqual(['Bob', 'Alice']);
  });

  it('populates the student with name, avatar and email only (no password)', async () => {
    const res = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(users.Admin));
    const student = res.body.data[0].student;
    expect(Object.keys(student).sort()).toEqual(['_id', 'email', 'name'].sort());
  });

  it('SECURITY: a Teacher gets the students without their email', async () => {
    const res = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(users.Teacher));
    expect(res.status).toBe(200);
    for (const conv of res.body.data as { student: Record<string, unknown> }[]) {
      expect(conv.student).not.toHaveProperty('email');
      expect(conv.student).toHaveProperty('name');
    }
  });

  it('a student gets only their own conversation (an object, not a list)', async () => {
    const res = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(alice));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(false);
    expect(res.body.data._id).toBe(String(aliceConv._id));
    expect(res.body.data.student.name).toBe('Alice');
    expect(res.body.data.student).not.toHaveProperty('password');
  });

  it('creates the conversation on first call and reuses it afterwards', async () => {
    const carol = await createUser('Student');
    const first = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(carol));
    expect(first.status).toBe(200);
    expect(first.body.data.unreadByStaff).toBe(0);
    expect(first.body.data.lastMessage).toBe('');
    const second = await request(app).get(CONVERSATIONS).set('Cookie', authCookie(carol));
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(await ChatConversation.countDocuments({ student: carol._id })).toBe(1);
  });

  it('works with the Bearer header', async () => {
    const res = await request(app).get(CONVERSATIONS).set('Authorization', bearer(alice));
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(String(aliceConv._id));
  });
});

describe('GET /api/chat/conversations/:id/messages', () => {
  const url = (id: unknown) => `${CONVERSATIONS}/${String(id)}/messages`;

  it('401 without a token', async () => {
    const res = await request(app).get(url(aliceConv._id));
    expect(res.status).toBe(401);
  });

  it('the owner reads the messages oldest first', async () => {
    const res = await request(app).get(url(aliceConv._id)).set('Cookie', authCookie(alice));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.map((m: { content: string }) => m.content)).toEqual([
      'first',
      'second',
      'third',
    ]);
    expect(res.body.data[0]).toMatchObject({
      senderName: 'Alice',
      senderRole: 'Student',
      conversationId: String(aliceConv._id),
    });
  });

  it.each(STAFF)('%s can read any conversation', async (role) => {
    const res = await request(app).get(url(bobConv._id)).set('Cookie', authCookie(users[role]));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("403 when a student opens another student's conversation (no IDOR)", async () => {
    const res = await request(app).get(url(bobConv._id)).set('Cookie', authCookie(alice));
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).not.toContain('bob secret');
  });

  it('only students may be non-staff: every non-staff role is limited to its own conversation', async () => {
    const nonStaff = ROLES.filter((role) => !STAFF.includes(role));
    expect(nonStaff).toEqual(['Student']);
  });

  it('404 for a conversation that does not exist', async () => {
    const res = await request(app).get(url(missingId())).set('Cookie', authCookie(users.Admin));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Conversation not found');
  });

  it('400 for a malformed id', async () => {
    const res = await request(app).get(url('not-an-id')).set('Cookie', authCookie(users.Admin));
    expect(res.status).toBe(400);
  });

  it('returns an empty list for a conversation without messages', async () => {
    const dave = await createUser('Student');
    const conv = await createConversation(dave);
    const res = await request(app).get(url(conv._id)).set('Cookie', authCookie(dave));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

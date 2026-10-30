import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Notification } from '../../src/models/Notification.model';
import { authCookie, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createNotificationDoc, daysAgo } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/notifications';
const DENIED: UserRole[] = ['Moderator', 'Teacher', 'Student'];
const MAX_TITLE = 140;

let users: Record<UserRole, IUser>;
let extraStudent: IUser;

const as = (role: UserRole) => authCookie(users[role]);
const idsOf = (recipients: Array<{ user: string }>) => recipients.map((r) => r.user).sort();

beforeAll(async () => {
  users = await createUsersForAllRoles();
  extraStudent = await createUser('Student');
});

describe('POST /api/notifications', () => {
  const valid = { title: ' Hello ', message: ' World ', targetRoles: ['Student'] };

  it('401 without a token', async () => {
    expect((await request(app).post(BASE).send(valid)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const res = await request(app).post(BASE).set('Cookie', as(role)).send(valid);
    expect(res.status).toBe(403);
  });

  it.each<UserRole>(['Super Admin', 'Admin'])(
    '%s sends to every user of the target roles',
    async (role) => {
      const res = await request(app)
        .post(BASE)
        .set('Cookie', as(role))
        .send({ ...valid, priority: 'High' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification sent to 2 users');
      expect(res.body.data).toMatchObject({
        title: 'Hello',
        message: 'World',
        priority: 'High',
        targetRoles: ['Student'],
        sentBy: { name: users[role].name, role },
      });
      expect(idsOf(res.body.data.recipients)).toEqual(
        [String(users.Student._id), String(extraStudent._id)].sort(),
      );
      const saved = await Notification.findById(res.body.data._id);
      expect(saved?.recipients).toHaveLength(2);
      expect(saved?.recipients.every((r) => r.readAt === undefined)).toBe(true);
      expect(String(saved?.sentBy)).toBe(String(users[role]._id));
    },
  );

  it('defaults the priority to Normal, de-duplicates and filters the roles', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .send({ title: 'T', message: 'M', targetRoles: ['Teacher', 'Teacher', 'Hacker', 5] });
    expect(res.status).toBe(201);
    expect(res.body.data.priority).toBe('Normal');
    expect(res.body.data.targetRoles).toEqual(['Teacher']);
    expect(res.body.message).toBe('Notification sent to 1 user');
  });

  it('recipients can then read it', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .send({ title: 'Visible', message: 'M', targetRoles: ['Moderator'] });
    const mine = await request(app).get(BASE).set('Cookie', as('Moderator'));
    expect(mine.body.data.map((n: { _id: string }) => n._id)).toContain(res.body.data._id);
  });

  it.each([
    ['missing title', { message: 'M', targetRoles: ['Student'] }],
    ['blank title', { title: '  ', message: 'M', targetRoles: ['Student'] }],
    ['missing message', { title: 'T', targetRoles: ['Student'] }],
    ['blank message', { title: 'T', message: ' ', targetRoles: ['Student'] }],
    ['bad priority', { title: 'T', message: 'M', priority: 'Huge', targetRoles: ['Student'] }],
    ['missing roles', { title: 'T', message: 'M' }],
    ['roles not an array', { title: 'T', message: 'M', targetRoles: 'Student' }],
    ['empty roles', { title: 'T', message: 'M', targetRoles: [] }],
    ['only unknown roles', { title: 'T', message: 'M', targetRoles: ['Root'] }],
    [
      'title too long',
      { title: 'x'.repeat(MAX_TITLE + 1), message: 'M', targetRoles: ['Student'] },
    ],
  ])('400 for %s', async (_name, body) => {
    const before = await Notification.countDocuments();
    const res = await request(app).post(BASE).set('Cookie', as('Admin')).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(await Notification.countDocuments()).toBe(before);
  });

  it('400 (not 500) when the title is not a string', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .send({ title: 123, message: 'M', targetRoles: ['Student'] });
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when the message is an object', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .send({ title: 'T', message: { $ne: 1 }, targetRoles: ['Student'] });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/notifications/sent/all', () => {
  const url = `${BASE}/sent/all`;

  it('401 without a token', async () => {
    expect((await request(app).get(url)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    expect((await request(app).get(url).set('Cookie', as(role))).status).toBe(403);
  });

  it('lists all notifications, newest first, paginated, with the sender', async () => {
    await createNotificationDoc(users.Admin, [users.Student], {
      title: 'sent-old',
      createdAt: daysAgo(30),
    });
    await createNotificationDoc(users['Super Admin'], [users.Teacher], { title: 'sent-new' });
    const res = await request(app).get(`${url}?limit=2`).set('Cookie', as('Super Admin'));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, page: 1, limit: 2 });
    expect(res.body.total).toBe(await Notification.countDocuments());
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].sentBy).toHaveProperty('name');
    const all = await request(app).get(`${url}?limit=100`).set('Cookie', as('Admin'));
    const titles = all.body.data.map((n: { title: string }) => n.title);
    expect(titles.indexOf('sent-new')).toBeLessThan(titles.indexOf('sent-old'));
  });
});

describe('PUT /api/notifications/:id', () => {
  const put = (id: string, role: UserRole, body: object) =>
    request(app).put(`${BASE}/${id}`).set('Cookie', as(role)).send(body);

  it('401 without a token', async () => {
    expect((await request(app).put(`${BASE}/${missingId()}`).send({ title: 'x' })).status).toBe(
      401,
    );
  });

  it.each(DENIED)('403 for %s', async (role) => {
    expect((await put(missingId(), role, { title: 'x' })).status).toBe(403);
  });

  it('updates title, message and priority', async () => {
    const n = await createNotificationDoc(users.Admin, [users.Student]);
    const res = await put(String(n._id), 'Admin', {
      title: ' New ',
      message: ' Msg ',
      priority: 'Urgent',
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Notification updated' });
    expect(res.body.data).toMatchObject({ title: 'New', message: 'Msg', priority: 'Urgent' });
    const saved = await Notification.findById(n._id);
    expect(saved).toMatchObject({ title: 'New', message: 'Msg', priority: 'Urgent' });
    expect(saved?.recipients).toHaveLength(1);
  });

  it('changing the target roles rebuilds the recipients and keeps existing read dates', async () => {
    const n = await createNotificationDoc(users.Admin, [users.Student, extraStudent], {
      readBy: [users.Student],
    });
    const res = await put(String(n._id), 'Super Admin', { targetRoles: ['Student', 'Teacher'] });
    expect(res.status).toBe(200);
    const saved = await Notification.findById(n._id);
    expect(saved?.targetRoles).toEqual(['Student', 'Teacher']);
    expect(saved?.recipients).toHaveLength(3);
    const read = saved?.recipients.find((r) => String(r.user) === String(users.Student._id));
    expect(read?.readAt).toBeInstanceOf(Date);
    const unread = saved?.recipients.find((r) => String(r.user) === String(users.Teacher._id));
    expect(unread?.readAt).toBeUndefined();
  });

  it('404 for a missing id (with and without targetRoles) and 400 for a malformed id', async () => {
    expect((await put(missingId(), 'Admin', { title: 'x' })).status).toBe(404);
    expect((await put(missingId(), 'Admin', { targetRoles: ['Student'] })).status).toBe(404);
    const bad = await put('nope', 'Admin', { title: 'x' });
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe('Invalid notification id');
  });

  it.each([
    ['blank title', { title: ' ' }],
    ['blank message', { message: '' }],
    ['bad priority', { priority: 'Huge' }],
    ['empty roles', { targetRoles: [] }],
    ['unknown roles', { targetRoles: ['Root'] }],
    ['title too long', { title: 'x'.repeat(MAX_TITLE + 1) }],
  ])('400 for %s and nothing changes', async (_name, body) => {
    const n = await createNotificationDoc(users.Admin, [users.Student], { title: 'keep' });
    const res = await put(String(n._id), 'Admin', body);
    expect(res.status).toBe(400);
    expect((await Notification.findById(n._id))?.title).toBe('keep');
  });

  it('400 (not 500) when the title is not a string', async () => {
    const n = await createNotificationDoc(users.Admin, [users.Student]);
    const res = await put(String(n._id), 'Admin', { title: 5 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/notifications/:id', () => {
  const del = (id: string, role: UserRole) =>
    request(app).delete(`${BASE}/${id}`).set('Cookie', as(role));

  it('401 without a token', async () => {
    expect((await request(app).delete(`${BASE}/${missingId()}`)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const n = await createNotificationDoc(users.Admin, [users.Student]);
    expect((await del(String(n._id), role)).status).toBe(403);
    expect(await Notification.exists({ _id: n._id })).toBeTruthy();
  });

  it('deletes it, and recipients no longer see it', async () => {
    const n = await createNotificationDoc(users.Admin, [users.Student]);
    const res = await del(String(n._id), 'Admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Notification deleted' });
    expect(await Notification.exists({ _id: n._id })).toBeNull();
    const mine = await request(app).get(BASE).set('Cookie', as('Student'));
    expect(mine.body.data.map((x: { _id: string }) => x._id)).not.toContain(String(n._id));
  });

  it('404 for a missing id and 400 for a malformed id', async () => {
    expect((await del(missingId(), 'Super Admin')).status).toBe(404);
    expect((await del('nope', 'Super Admin')).status).toBe(400);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Notification } from '../../src/models/Notification.model';
import { authCookie, bearer, createUser, createUsersForAllRoles, missingId } from '../factories';
import { createNotificationDoc, daysAgo } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/notifications';

let users: Record<UserRole, IUser>;
let reader: IUser;
let other: IUser;

const readAtOf = async (notificationId: unknown, user: IUser) => {
  const doc = await Notification.findById(notificationId);
  return doc?.recipients.find((r) => String(r.user) === String(user._id))?.readAt;
};

beforeAll(async () => {
  users = await createUsersForAllRoles();
  reader = await createUser('Student');
  other = await createUser('Student');
});

describe('GET /api/notifications (mine)', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(BASE)).status).toBe(401);
  });

  it('lists only my notifications, newest first, with isRead/readAt and the sender', async () => {
    const me = await createUser('Student');
    const old = await createNotificationDoc(users.Admin, [me], {
      title: 'old',
      createdAt: daysAgo(5),
      readBy: [me],
    });
    const fresh = await createNotificationDoc(users.Admin, [me, other], { title: 'fresh' });
    await createNotificationDoc(users.Admin, [other], { title: 'not mine' });

    const res = await request(app).get(BASE).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, total: 2, page: 1, limit: 10 });
    expect(res.body.data.map((n: { title: string }) => n.title)).toEqual(['fresh', 'old']);
    expect(res.body.data[0]).toMatchObject({ _id: String(fresh._id), isRead: false, readAt: null });
    expect(res.body.data[1]).toMatchObject({ _id: String(old._id), isRead: true });
    expect(res.body.data[1].readAt).toBeTruthy();
    expect(res.body.data[0].sentBy).toMatchObject({ name: users.Admin.name, role: 'Admin' });
    expect(res.body.data[0].sentBy).not.toHaveProperty('password');
  });

  it('paginates and clamps limit to 1..100, page to >= 1', async () => {
    const me = await createUser('Student');
    for (let i = 0; i < 3; i += 1) {
      await createNotificationDoc(users.Admin, [me], { createdAt: daysAgo(i) });
    }
    const page2 = await request(app).get(`${BASE}?page=2&limit=2`).set('Cookie', authCookie(me));
    expect(page2.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(page2.body.data).toHaveLength(1);
    const clamped = await request(app)
      .get(`${BASE}?page=-4&limit=5000`)
      .set('Cookie', authCookie(me));
    expect(clamped.body).toMatchObject({ page: 1, limit: 100 });
    const zero = await request(app).get(`${BASE}?limit=0`).set('Cookie', authCookie(me));
    expect(zero.body.limit).toBe(10);
  });

  it('each recipient sees their own read state', async () => {
    const a = await createUser('Student');
    const b = await createUser('Student');
    await createNotificationDoc(users.Admin, [a, b], { readBy: [a] });
    const resA = await request(app).get(BASE).set('Cookie', authCookie(a));
    const resB = await request(app).get(BASE).set('Cookie', authCookie(b));
    expect(resA.body.data[0].isRead).toBe(true);
    expect(resB.body.data[0].isRead).toBe(false);
  });

  it('never sends the recipients list (other users) to a recipient', async () => {
    const a = await createUser('Student');
    const b = await createUser('Student');
    const doc = await createNotificationDoc(users.Admin, [a, b], { readBy: [b] });
    const list = await request(app).get(BASE).set('Cookie', authCookie(a));
    expect(list.body.data[0]).not.toHaveProperty('recipients');
    expect(JSON.stringify(list.body)).not.toContain(String(b._id));
    const read = await request(app)
      .patch(`${BASE}/${String(doc._id)}/read`)
      .set('Cookie', authCookie(a));
    expect(read.status).toBe(200);
    expect(read.body.data).not.toHaveProperty('recipients');
    expect(read.body.data.isRead).toBe(true);
  });

  it('works with the Bearer header', async () => {
    const res = await request(app).get(BASE).set('Authorization', bearer(reader));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/notifications/unread-count', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(`${BASE}/unread-count`)).status).toBe(401);
  });

  it('counts only my unread notifications', async () => {
    const me = await createUser('Student');
    await createNotificationDoc(users.Admin, [me]);
    await createNotificationDoc(users.Admin, [me]);
    await createNotificationDoc(users.Admin, [me], { readBy: [me] });
    await createNotificationDoc(users.Admin, [other]);
    const res = await request(app).get(`${BASE}/unread-count`).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { count: 2 } });
  });

  it('is 0 for a user without notifications', async () => {
    const me = await createUser('Teacher');
    const res = await request(app).get(`${BASE}/unread-count`).set('Cookie', authCookie(me));
    expect(res.body.data.count).toBe(0);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  it('401 without a token', async () => {
    const res = await request(app).patch(`${BASE}/${missingId()}/read`);
    expect(res.status).toBe(401);
  });

  it('marks it read for me only and returns it', async () => {
    const a = await createUser('Student');
    const b = await createUser('Student');
    const n = await createNotificationDoc(users.Admin, [a, b]);
    const res = await request(app).patch(`${BASE}/${n._id}/read`).set('Cookie', authCookie(a));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Notification marked as read' });
    expect(res.body.data).toMatchObject({ _id: String(n._id), isRead: true });
    expect(await readAtOf(n._id, a)).toBeInstanceOf(Date);
    expect(await readAtOf(n._id, b)).toBeUndefined();
  });

  it("404 when I am not a recipient (cannot touch other users' notifications)", async () => {
    const a = await createUser('Student');
    const n = await createNotificationDoc(users.Admin, [a]);
    const res = await request(app).patch(`${BASE}/${n._id}/read`).set('Cookie', authCookie(other));
    expect(res.status).toBe(404);
    expect(await readAtOf(n._id, a)).toBeUndefined();
  });

  it('404 for a missing id and 400 for a malformed id', async () => {
    const missing = await request(app)
      .patch(`${BASE}/${missingId()}/read`)
      .set('Cookie', authCookie(reader));
    expect(missing.status).toBe(404);
    const bad = await request(app).patch(`${BASE}/nope/read`).set('Cookie', authCookie(reader));
    expect(bad.status).toBe(400);
    expect(bad.body.message).toBe('Invalid notification id');
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('401 without a token', async () => {
    expect((await request(app).patch(`${BASE}/read-all`)).status).toBe(401);
  });

  it('marks all of my unread notifications read and leaves everyone else alone', async () => {
    const a = await createUser('Student');
    const b = await createUser('Student');
    const n1 = await createNotificationDoc(users.Admin, [a, b]);
    const n2 = await createNotificationDoc(users.Admin, [a]);
    const res = await request(app).patch(`${BASE}/read-all`).set('Cookie', authCookie(a));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'All notifications marked as read' });
    expect(await readAtOf(n1._id, a)).toBeInstanceOf(Date);
    expect(await readAtOf(n2._id, a)).toBeInstanceOf(Date);
    expect(await readAtOf(n1._id, b)).toBeUndefined();
    const count = await request(app).get(`${BASE}/unread-count`).set('Cookie', authCookie(a));
    expect(count.body.data.count).toBe(0);
  });

  it('keeps an earlier readAt unchanged', async () => {
    const a = await createUser('Student');
    const n = await createNotificationDoc(users.Admin, [a], { readBy: [a] });
    const before = await readAtOf(n._id, a);
    await request(app).patch(`${BASE}/read-all`).set('Cookie', authCookie(a));
    expect((await readAtOf(n._id, a))?.getTime()).toBe(before?.getTime());
  });
});

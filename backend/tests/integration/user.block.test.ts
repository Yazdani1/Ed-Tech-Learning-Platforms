import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { AuditLog } from '../../src/models/AuditLog.model';
import { User } from '../../src/models/User.model';
import { TEST_PASSWORD, authCookie, bearer, createUser, missingId } from '../factories';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const block = (
  actor: IUser,
  target: IUser | string,
  body: Record<string, unknown> = { blocked: true },
) =>
  request(app)
    .patch(`/api/users/${typeof target === 'string' ? target : String(target._id)}/block`)
    .set('Cookie', authCookie(actor))
    .send(body);
const history = (actor: IUser, target: IUser | string) =>
  request(app)
    .get(`/api/users/${typeof target === 'string' ? target : String(target._id)}/history`)
    .set('Cookie', authCookie(actor));

let superAdmin: IUser;
let admin: IUser;

beforeEach(async () => {
  await AuditLog.deleteMany({});
  superAdmin = await createUser('Super Admin');
  admin = await createUser('Admin');
});

describe('PATCH /api/users/:id/block', () => {
  it('lets a Super Admin block anyone (also an Admin and another Super Admin) and records it', async () => {
    for (const role of ['Super Admin', 'Admin', 'Moderator', 'Teacher', 'Student'] as UserRole[]) {
      const target = await createUser(role);
      const res = await block(superAdmin, target, { blocked: true, reason: 'Spam' });
      expect(res.status, role).toBe(200);
      expect(res.body.data).toMatchObject({ isBlocked: true, blockReason: 'Spam' });
      expect(res.body.data).not.toHaveProperty('password');
    }
    expect(await AuditLog.countDocuments({ action: 'user.block' })).toBe(5);
  });

  it.each(['Moderator', 'Teacher', 'Student'] as UserRole[])(
    'lets an Admin block a %s',
    async (role) => {
      const target = await createUser(role);
      expect((await block(admin, target)).status).toBe(200);
    },
  );

  it.each(['Admin', 'Super Admin'] as UserRole[])(
    '403 when an Admin blocks an %s',
    async (role) => {
      const target = await createUser(role);
      expect((await block(admin, target)).status).toBe(403);
      expect((await User.findById(target._id).lean())?.isBlocked).toBe(false);
    },
  );

  it('a blocked user is signed out at once and cannot sign in; unblocking lets them back in', async () => {
    const student = await createUser('Student');
    expect((await request(app).get('/api/auth/me').set('Cookie', authCookie(student))).status).toBe(
      200,
    );
    await block(superAdmin, student);
    // Tokens issued before the block are revoked (signed out); a newer one still meets the block (403)
    const me = await request(app).get('/api/auth/me').set('Cookie', authCookie(student));
    expect([401, 403]).toContain(me.status);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: TEST_PASSWORD });
    expect(login.status).toBe(403);
    expect(login.headers['set-cookie']).toBeUndefined();
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'wrong-pass' });
    expect(wrong.status).toBe(401);

    const unblock = await block(superAdmin, student, { blocked: false });
    expect(unblock.status).toBe(200);
    expect(unblock.body.data.isBlocked).toBe(false);
    expect(unblock.body.data).not.toHaveProperty('blockReason');
    // Signing in again after the unblock (a moment later) works
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 2000 });
    const again = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: TEST_PASSWORD });
    expect(again.status).toBe(200);
    vi.useRealTimers();
  });

  it('treats a blocked user as a guest on public pages', async () => {
    const student = await createUser('Student');
    await block(superAdmin, student);
    expect((await request(app).get('/api/courses').set('Cookie', authCookie(student))).status).toBe(
      200,
    );
  });

  it('400 for self, an unchanged state or bad input', async () => {
    expect((await block(superAdmin, superAdmin)).status).toBe(400);
    const student = await createUser('Student');
    expect((await block(superAdmin, student, { blocked: false })).status).toBe(400);
    expect((await block(superAdmin, student, { blocked: 'yes' })).status).toBe(400);
    expect(
      (await block(superAdmin, student, { blocked: true, reason: 'x'.repeat(301) })).status,
    ).toBe(400);
    expect((await block(superAdmin, student, { blocked: true, reason: { $ne: 1 } })).status).toBe(
      400,
    );
  });

  it('404 for an unknown or malformed id', async () => {
    expect((await block(superAdmin, missingId())).status).toBe(404);
    expect((await block(superAdmin, 'not-an-id')).status).toBe(404);
  });

  it('401 without a token, Bearer accepted, 403 for other roles', async () => {
    const student = await createUser('Student');
    expect(
      (
        await request(app)
          .patch(`/api/users/${String(student._id)}/block`)
          .send({ blocked: true })
      ).status,
    ).toBe(401);
    for (const role of ['Moderator', 'Teacher', 'Student'] as UserRole[]) {
      expect((await block(await createUser(role), student)).status, role).toBe(403);
    }
    const res = await request(app)
      .patch(`/api/users/${String(student._id)}/block`)
      .set('Authorization', bearer(superAdmin))
      .send({ blocked: true });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/users/:id/history', () => {
  it('lists role changes (from both endpoints) and blocks with who did them, newest first', async () => {
    const user = await createUser('Student');
    await request(app)
      .put(`/api/users/${String(user._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Teacher' });
    await request(app)
      .put(`/api/users/${String(user._id)}`)
      .set('Cookie', authCookie(superAdmin))
      .send({ role: 'Moderator' });
    await block(superAdmin, user, { blocked: true, reason: 'Abuse' });

    const res = await history(admin, user);
    expect(res.status).toBe(200);
    const rows = res.body.data as Array<Record<string, unknown>>;
    expect(rows.map((row) => row.action)).toEqual(['user.block', 'user.role', 'user.role']);
    expect(rows[1]).toMatchObject({ before: { role: 'Teacher' }, after: { role: 'Moderator' } });
    expect(rows[2]).toMatchObject({ before: { role: 'Student' }, after: { role: 'Teacher' } });
    expect(rows[2].actor).toMatchObject({ name: admin.name, role: 'Admin' });
    expect(rows[0]).toMatchObject({ note: 'Abuse' });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('records nothing when the role stays the same', async () => {
    const user = await createUser('Student');
    await request(app)
      .put(`/api/users/${String(user._id)}`)
      .set('Cookie', authCookie(superAdmin))
      .send({ role: 'Student', name: 'Same Role' });
    expect((await history(superAdmin, user)).body.data).toEqual([]);
  });

  it('404 for an unknown user; 401; 403 for other roles', async () => {
    expect((await history(superAdmin, missingId())).status).toBe(404);
    expect((await history(superAdmin, 'bad')).status).toBe(404);
    const user = await createUser('Student');
    expect((await request(app).get(`/api/users/${String(user._id)}/history`)).status).toBe(401);
    for (const role of ['Moderator', 'Teacher', 'Student'] as UserRole[]) {
      expect((await history(await createUser(role), user)).status, role).toBe(403);
    }
  });
});

describe('GET /api/users?status=', () => {
  it('filters active and blocked users', async () => {
    const blocked = await createUser('Student');
    await block(superAdmin, blocked);
    const list = async (status: string) =>
      (
        await request(app)
          .get(`/api/users?status=${status}&limit=100`)
          .set('Cookie', authCookie(superAdmin))
      ).body.data as Array<{ _id: string; isBlocked: boolean }>;
    const blockedRows = await list('blocked');
    expect(blockedRows.some((row) => row._id === String(blocked._id))).toBe(true);
    expect(blockedRows.every((row) => row.isBlocked)).toBe(true);
    const activeRows = await list('active');
    expect(activeRows.some((row) => row._id === String(blocked._id))).toBe(false);
    expect(activeRows.every((row) => !row.isBlocked)).toBe(true);
  });
});

describe('Blocking and the remaining Super Admin', () => {
  it('a blocked Super Admin does not count as the one who must remain', async () => {
    const other = await createUser('Super Admin');
    // Only these two Super Admins can sign in in this test
    await User.updateMany(
      { role: 'Super Admin', _id: { $nin: [superAdmin._id, other._id] } },
      { isBlocked: true },
    );
    expect((await block(superAdmin, other)).status).toBe(200);
    const demote = await request(app)
      .put(`/api/users/${String(superAdmin._id)}/role`)
      .set('Cookie', authCookie(superAdmin))
      .send({ role: 'Admin' });
    expect(demote.status).toBe(400);
    expect(demote.body.message).toBe('At least one Super Admin must remain');
  });

  it('an old token stays invalid after the user is unblocked', async () => {
    const student = await createUser('Student');
    const oldCookie = authCookie(student);
    await block(superAdmin, student);
    await block(superAdmin, student, { blocked: false });
    expect((await request(app).get('/api/auth/me').set('Cookie', oldCookie)).status).toBe(401);
  });

  it('an Admin cannot read the history of an Admin account', async () => {
    const otherAdmin = await createUser('Admin');
    expect((await history(admin, otherAdmin)).status).toBe(403);
    expect((await history(superAdmin, otherAdmin)).status).toBe(200);
  });
});

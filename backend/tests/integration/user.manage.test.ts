import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { User } from '../../src/models/User.model';
import { authCookie, createUser, missingId, nextId, TEST_PASSWORD } from '../factories';

import type { UserRole } from '../../src/types/index';

const NOT_ALLOWED: UserRole[] = ['Moderator', 'Teacher', 'Student'];

const newUserBody = (role?: UserRole) => {
  const n = nextId();
  return {
    name: `Managed ${n}`,
    email: `managed${n}@example.com`,
    password: 'Managed-pass-1',
    ...(role ? { role } : {}),
  };
};

describe('POST /api/users', () => {
  it.each(['Super Admin', 'Admin'] as const)(
    'a %s creates a user with a role; no password in the reply',
    async (role) => {
      const actor = await createUser(role);
      const body = newUserBody('Teacher');

      const res = await request(app).post('/api/users').set('Cookie', authCookie(actor)).send(body);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        success: true,
        message: 'User created',
        data: { email: body.email, role: 'Teacher' },
      });
      expect(res.body.data.password).toBeUndefined();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ email: body.email, password: body.password });
      expect(login.status).toBe(200);
    },
  );

  it('an unknown role falls back to Student', async () => {
    const actor = await createUser('Admin');

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(actor))
      .send({ ...newUserBody(), role: 'Owner' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('Student');
  });

  it('only a Super Admin can create a Super Admin (Admin: 403, nothing saved)', async () => {
    const admin = await createUser('Admin');
    const superAdmin = await createUser('Super Admin');
    const byAdmin = newUserBody('Super Admin');
    const bySuper = newUserBody('Super Admin');

    const denied = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(admin))
      .send(byAdmin);
    const allowed = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(superAdmin))
      .send(bySuper);

    expect(denied.status).toBe(403);
    expect(await User.exists({ email: byAdmin.email })).toBeNull();
    expect(allowed.status).toBe(201);
    expect(allowed.body.data.role).toBe('Super Admin');
  });

  it('answers 400 for missing fields and for operator objects', async () => {
    const actor = await createUser('Admin');

    const missing = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(actor))
      .send({ name: 'x' });
    const injected = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(actor))
      .send({ ...newUserBody(), email: { $gt: '' } });

    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Name, email and password are required');
    expect(injected.status).toBe(400);
  });

  it('answers 400 for an email already in use (any letter case)', async () => {
    const actor = await createUser('Admin');
    const existing = await createUser('Student');

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(actor))
      .send({ ...newUserBody(), email: existing.email.toUpperCase() });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is already in use');
  });

  it('answers 401 without a token and 403 for other roles', async () => {
    const anonymous = await request(app).post('/api/users').send(newUserBody());
    expect(anonymous.status).toBe(401);

    for (const role of NOT_ALLOWED) {
      const actor = await createUser(role);
      const res = await request(app)
        .post('/api/users')
        .set('Cookie', authCookie(actor))
        .send(newUserBody());
      expect(res.status, role).toBe(403);
    }
  });
});

describe('PUT /api/users/:id', () => {
  it('an Admin updates name, email, role and password of a non-Super-Admin user', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');

    const res = await request(app)
      .put(`/api/users/${String(target._id)}`)
      .set('Cookie', authCookie(admin))
      .send({
        name: ' Renamed ',
        email: ' RENAMED@Example.com ',
        role: 'Teacher',
        password: 'Reset-pass-1',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'User updated',
      data: { name: 'Renamed', email: 'renamed@example.com', role: 'Teacher' },
    });
    expect(res.body.data.password).toBeUndefined();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'renamed@example.com', password: 'Reset-pass-1' });
    expect(login.status).toBe(200);
  });

  it('an admin password reset signs the user out everywhere (old tokens revoked)', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');
    const targetCookie = authCookie(target);

    await request(app)
      .put(`/api/users/${String(target._id)}`)
      .set('Cookie', authCookie(admin))
      .send({ password: 'Reset-pass-2' })
      .expect(200);
    const me = await request(app).get('/api/auth/me').set('Cookie', targetCookie);

    expect(me.status).toBe(401);
  });

  it('an Admin cannot change a Super Admin account or promote anyone to Super Admin (403)', async () => {
    const admin = await createUser('Admin');
    const superAdmin = await createUser('Super Admin');
    const student = await createUser('Student');

    const takeover = await request(app)
      .put(`/api/users/${String(superAdmin._id)}`)
      .set('Cookie', authCookie(admin))
      .send({ password: 'Taken-over-1' });
    const promote = await request(app)
      .put(`/api/users/${String(student._id)}`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Super Admin' });

    expect(takeover.status).toBe(403);
    expect(promote.status).toBe(403);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: superAdmin.email, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect((await User.findById(student._id))?.role).toBe('Student');
  });

  it('a Super Admin resetting their own password stays signed in with a fresh cookie', async () => {
    const actor = await createUser('Super Admin');

    const res = await request(app)
      .put(`/api/users/${String(actor._id)}`)
      .set('Cookie', authCookie(actor))
      .send({ password: 'Own-reset-pass-1' });

    expect(res.status).toBe(200);
    const fresh = String(res.headers['set-cookie']).split(';')[0];
    const me = await request(app).get('/api/auth/me').set('Cookie', fresh);
    expect(me.status).toBe(200);
  });

  it('a Super Admin can update another Super Admin', async () => {
    const actor = await createUser('Super Admin');
    const target = await createUser('Super Admin');

    const res = await request(app)
      .put(`/api/users/${String(target._id)}`)
      .set('Cookie', authCookie(actor))
      .send({ name: 'Second Owner' });

    expect(res.status).toBe(200);
  });

  it('answers 400 for an empty name, an invalid role, a taken email, or a non-string field', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');
    const other = await createUser('Student');
    const url = `/api/users/${String(target._id)}`;

    const results = await Promise.all([
      request(app).put(url).set('Cookie', authCookie(admin)).send({ name: '  ' }),
      request(app).put(url).set('Cookie', authCookie(admin)).send({ role: 'Owner' }),
      request(app).put(url).set('Cookie', authCookie(admin)).send({ email: other.email }),
      request(app)
        .put(url)
        .set('Cookie', authCookie(admin))
        .send({ name: ['a'] }),
    ]);

    expect(results.map((r) => r.status)).toEqual([400, 400, 400, 400]);
    expect(results[0].body.message).toBe('Name is required');
    expect(results[1].body.message).toBe('Invalid role');
    expect(results[2].body.message).toBe('Email is already in use');
  });

  it('answers 404 for a missing user and 400 for a malformed id (without echoing it)', async () => {
    const admin = await createUser('Admin');

    const missing = await request(app)
      .put(`/api/users/${missingId()}`)
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });
    const malformed = await request(app)
      .put('/api/users/<script>')
      .set('Cookie', authCookie(admin))
      .send({ name: 'x' });

    expect(missing.status).toBe(404);
    expect(missing.body.message).toBe('User not found');
    expect(malformed.status).toBe(400);
    expect(malformed.body.message).not.toContain('<script>');
  });

  it('answers 403 for Moderator, Teacher and Student', async () => {
    const target = await createUser('Student');
    for (const role of NOT_ALLOWED) {
      const actor = await createUser(role);
      const res = await request(app)
        .put(`/api/users/${String(target._id)}`)
        .set('Cookie', authCookie(actor))
        .send({ name: 'x' });
      expect(res.status, role).toBe(403);
    }
  });
});

describe('Admin accounts and the last Super Admin', () => {
  it('an Admin cannot create, edit, re-role or promote to Admin accounts (403); a Super Admin can', async () => {
    const admin = await createUser('Admin');
    const otherAdmin = await createUser('Admin');
    const student = await createUser('Student');
    const superAdmin = await createUser('Super Admin');

    const create = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(admin))
      .send(newUserBody('Admin'));
    const edit = await request(app)
      .put(`/api/users/${String(otherAdmin._id)}`)
      .set('Cookie', authCookie(admin))
      .send({ password: 'Taken-over-2' });
    const demote = await request(app)
      .put(`/api/users/${String(otherAdmin._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Student' });
    const promote = await request(app)
      .put(`/api/users/${String(student._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Admin' });
    const bySuper = await request(app)
      .put(`/api/users/${String(student._id)}/role`)
      .set('Cookie', authCookie(superAdmin))
      .send({ role: 'Admin' });

    expect([create.status, edit.status, demote.status, promote.status]).toEqual([
      403, 403, 403, 403,
    ]);
    expect(bySuper.status).toBe(200);
  });

  it('a password set by an admin must be 6-72 characters', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');

    const shortOnCreate = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie(admin))
      .send({ ...newUserBody(), password: '123' });
    const shortOnUpdate = await request(app)
      .put(`/api/users/${String(target._id)}`)
      .set('Cookie', authCookie(admin))
      .send({ password: '123' });

    expect(shortOnCreate.status).toBe(400);
    expect(shortOnUpdate.status).toBe(400);
    expect(shortOnUpdate.body.message).toBe('Password must be 6-72 characters');
  });

  it('the last Super Admin cannot be demoted or deleted (400); with two, one can go', async () => {
    await User.deleteMany({ role: 'Super Admin' });
    const only = await createUser('Super Admin');

    const demote = await request(app)
      .put(`/api/users/${String(only._id)}/role`)
      .set('Cookie', authCookie(only))
      .send({ role: 'Admin' });
    const remove = await request(app)
      .delete(`/api/users/${String(only._id)}`)
      .set('Cookie', authCookie(only));
    const second = await createUser('Super Admin');
    const removeWithTwo = await request(app)
      .delete(`/api/users/${String(second._id)}`)
      .set('Cookie', authCookie(only));

    expect(demote.status).toBe(400);
    expect(demote.body.message).toBe('At least one Super Admin must remain');
    expect(remove.status).toBe(400);
    expect(removeWithTwo.status).toBe(200);
  });
});

describe('PUT /api/users/:id/role', () => {
  it('an Admin changes a role', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');

    const res = await request(app)
      .put(`/api/users/${String(target._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Moderator' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ message: 'Role updated', data: { role: 'Moderator' } });
  });

  it('an Admin cannot grant Super Admin or demote a Super Admin (403)', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const superAdmin = await createUser('Super Admin');

    const grant = await request(app)
      .put(`/api/users/${String(student._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Super Admin' });
    const demote = await request(app)
      .put(`/api/users/${String(superAdmin._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Student' });

    expect(grant.status).toBe(403);
    expect(demote.status).toBe(403);
    expect((await User.findById(superAdmin._id))?.role).toBe('Super Admin');
  });

  it('a Super Admin can grant Super Admin', async () => {
    const actor = await createUser('Super Admin');
    const target = await createUser('Admin');

    const res = await request(app)
      .put(`/api/users/${String(target._id)}/role`)
      .set('Cookie', authCookie(actor))
      .send({ role: 'Super Admin' });

    expect(res.status).toBe(200);
  });

  it('answers 400 for an invalid role and 404 for a missing user', async () => {
    const admin = await createUser('Admin');
    const target = await createUser('Student');

    const invalid = await request(app)
      .put(`/api/users/${String(target._id)}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Owner' });
    const missing = await request(app)
      .put(`/api/users/${missingId()}/role`)
      .set('Cookie', authCookie(admin))
      .send({ role: 'Teacher' });

    expect(invalid.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('answers 403 for Moderator, Teacher and Student', async () => {
    const target = await createUser('Student');
    for (const role of NOT_ALLOWED) {
      const actor = await createUser(role);
      const res = await request(app)
        .put(`/api/users/${String(target._id)}/role`)
        .set('Cookie', authCookie(actor))
        .send({ role: 'Teacher' });
      expect(res.status, role).toBe(403);
    }
  });
});

describe('DELETE /api/users/:id', () => {
  it('a Super Admin deletes a user', async () => {
    const actor = await createUser('Super Admin');
    const target = await createUser('Student');

    const res = await request(app)
      .delete(`/api/users/${String(target._id)}`)
      .set('Cookie', authCookie(actor));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'User deleted' });
    expect(await User.exists({ _id: target._id })).toBeNull();
  });

  it('answers 404 for a missing user', async () => {
    const actor = await createUser('Super Admin');

    const res = await request(app)
      .delete(`/api/users/${missingId()}`)
      .set('Cookie', authCookie(actor));

    expect(res.status).toBe(404);
  });

  it('answers 403 for every role except Super Admin (Admin included)', async () => {
    const target = await createUser('Student');
    for (const role of ['Admin', ...NOT_ALLOWED] as UserRole[]) {
      const actor = await createUser(role);
      const res = await request(app)
        .delete(`/api/users/${String(target._id)}`)
        .set('Cookie', authCookie(actor));
      expect(res.status, role).toBe(403);
    }
    expect(await User.exists({ _id: target._id })).not.toBeNull();
  });
});

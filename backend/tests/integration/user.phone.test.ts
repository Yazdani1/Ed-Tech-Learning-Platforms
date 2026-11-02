import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { User } from '../../src/models/User.model';
import { authCookie, createUser, nextId } from '../factories';

import type { IUser } from '../../src/models/User.model';

// The optional contact phone number: register, own profile, admin create / update.

const PHONE_LENGTH_OVER_LIMIT = 25;

const account = (phone: unknown) => {
  const n = nextId();
  return { name: `Phone ${n}`, email: `phone${n}@example.com`, password: 'Secret-pass-1', phone };
};

let admin: IUser;
beforeAll(async () => {
  admin = await createUser('Admin');
});

describe('phone number', () => {
  it('register saves a trimmed phone number; registering without one still works', async () => {
    const withPhone = account('  +880 1711-123456 ');
    const res = await request(app).post('/api/auth/register').send(withPhone);
    expect(res.status).toBe(201);
    expect((await User.findOne({ email: withPhone.email }))?.phone).toBe('+880 1711-123456');
    const without = account(undefined);
    expect((await request(app).post('/api/auth/register').send(without)).status).toBe(201);
  });

  it.each([
    ['letters', 'call me'],
    ['too short', '12'],
    ['an object', { $ne: null }],
    ['too long', '1'.repeat(PHONE_LENGTH_OVER_LIMIT)],
  ])('register answers 400 for %s', async (_name, phone) => {
    const res = await request(app).post('/api/auth/register').send(account(phone));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid phone number');
  });

  it('a user sets and removes their own phone number from the profile', async () => {
    const student = await createUser('Student');
    const me = () => request(app).put('/api/auth/me').set('Cookie', authCookie(student));
    const set = await me().send({ phone: '01711 000111' });
    expect(set.status).toBe(200);
    expect(set.body.data.phone).toBe('01711 000111');
    const removed = await me().send({ phone: '' });
    expect(removed.status).toBe(200);
    expect(removed.body.data.phone).toBeUndefined();
    const bad = await me().send({ phone: 'abc' });
    expect(bad.status).toBe(400);
  });

  it('an admin creates a user with a phone and changes or clears it', async () => {
    const cookie = authCookie(admin);
    const created = await request(app)
      .post('/api/users')
      .set('Cookie', cookie)
      .send(account('+44 20 7946 0958'));
    expect(created.status).toBe(201);
    expect(created.body.data.phone).toBe('+44 20 7946 0958');
    const url = `/api/users/${created.body.data._id as string}`;
    const changed = await request(app).put(url).set('Cookie', cookie).send({ phone: '0123456789' });
    expect(changed.body.data.phone).toBe('0123456789');
    const cleared = await request(app).put(url).set('Cookie', cookie).send({ phone: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.body.data.phone).toBeUndefined();
    const bad = await request(app)
      .put(url)
      .set('Cookie', cookie)
      .send({ phone: ['1'] });
    expect(bad.status).toBe(400);
  });

  it('accepts 6 and 20 characters, refuses 21 (same limit as the model)', async () => {
    const ok6 = await request(app).post('/api/auth/register').send(account('123456'));
    expect(ok6.status).toBe(201);
    const ok20 = await request(app)
      .post('/api/auth/register')
      .send(account('+1234567890123456789'));
    expect(ok20.status).toBe(201);
    const bad21 = await request(app)
      .post('/api/auth/register')
      .send(account('+12345678901234567890'));
    expect(bad21.status).toBe(400);
    expect(bad21.body.message).toBe('Invalid phone number');
  });

  it.each([{ $ne: null }, ['1'], 12345])(
    'admin create / update answer 400 for a non-string phone %j',
    async (phone) => {
      const cookie = authCookie(admin);
      const created = await request(app)
        .post('/api/users')
        .set('Cookie', cookie)
        .send(account(phone));
      expect(created.status).toBe(400);
      const student = await createUser('Student');
      const updated = await request(app)
        .put(`/api/users/${student._id}`)
        .set('Cookie', cookie)
        .send({ phone });
      expect(updated.status).toBe(400);
    },
  );

  it('an Admin cannot change the phone of an Admin or a Super Admin account (403)', async () => {
    for (const role of ['Admin', 'Super Admin'] as const) {
      const target = await createUser(role);
      const res = await request(app)
        .put(`/api/users/${target._id}`)
        .set('Cookie', authCookie(admin))
        .send({ phone: '0123456789' });
      expect(res.status).toBe(403);
      expect((await User.findById(target._id))?.phone).toBeUndefined();
    }
  });

  it('the saved phone comes back from GET /api/auth/me and GET /api/users/:id', async () => {
    const student = await createUser('Student', { phone: '01711 222333' });
    const me = await request(app).get('/api/auth/me').set('Cookie', authCookie(student));
    expect(me.body.data.phone).toBe('01711 222333');
    const one = await request(app)
      .get(`/api/users/${student._id}`)
      .set('Cookie', authCookie(admin));
    expect(one.body.data.phone).toBe('01711 222333');
  });
});

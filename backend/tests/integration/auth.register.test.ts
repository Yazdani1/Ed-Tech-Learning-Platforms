import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { User } from '../../src/models/User.model';
import { createUser, nextId } from '../factories';

const newAccount = () => {
  const n = nextId();
  return { name: `New Student ${n}`, email: `new${n}@example.com`, password: 'Secret-pass-1' };
};

describe('POST /api/auth/register', () => {
  it('creates a Student, sets the httpOnly token cookie and never returns the password', async () => {
    const account = newAccount();

    const res = await request(app).post('/api/auth/register').send(account);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Registered successfully',
      data: { name: account.name, email: account.email, role: 'Student' },
    });
    expect(JSON.stringify(res.body)).not.toContain('Secret-pass-1');
    expect(res.body.data.password).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^token=/);
    expect(cookie).toContain('HttpOnly');

    const saved = await User.findOne({ email: account.email }).select('+password');
    expect(saved?.password).toBeDefined();
    expect(saved?.password).not.toBe(account.password);
  });

  it('ignores a role sent by the client (always Student)', async () => {
    const account = newAccount();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...account, role: 'Super Admin' });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('Student');
  });

  it('stores the email trimmed and lower-case', async () => {
    const account = newAccount();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...account, email: `  ${account.email.toUpperCase()} ` });

    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(account.email);
  });

  it.each([
    ['name', { name: '' }],
    ['email', { email: '' }],
    ['password', { password: '' }],
  ])('answers 400 when %s is missing', async (_field, override) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...newAccount(), ...override });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Name, email and password are required' });
  });

  it('answers 400 for a password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...newAccount(), password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Password must be 6-72 characters');
  });

  it('rejects operator objects instead of strings (NoSQL injection)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...newAccount(), email: { $ne: null } });

    expect(res.status).toBe(400);
  });

  it('answers 400 when the email is already registered (any letter case)', async () => {
    const existing = await createUser('Student');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...newAccount(), email: existing.email.toUpperCase() });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is already registered');
  });
});

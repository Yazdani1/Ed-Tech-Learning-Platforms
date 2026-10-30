import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { createUser, TEST_PASSWORD } from '../factories';

const MAX_FAILED_ATTEMPTS = 10;

describe('POST /api/auth/login', () => {
  it('signs in: 200 with the user (no password) and a secure-by-default httpOnly cookie', async () => {
    const user = await createUser('Teacher');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Logged in successfully',
      data: { _id: String(user._id), name: user.name, email: user.email, role: 'Teacher' },
    });
    expect(res.body.data.password).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^token=[^;]+/);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('accepts the email in any letter case and with spaces', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: `  ${user.email.toUpperCase()}  `, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
  });

  it('the cookie it sets signs the user in for GET /api/auth/me', async () => {
    const user = await createUser('Admin');
    const agent = request.agent(app);

    await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD })
      .expect(200);
    const me = await agent.get('/api/auth/me');

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(user.email);
  });

  it('answers 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'someone@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Email and password are required' });
  });

  it('answers the same generic 401 for an unknown email and a wrong password', async () => {
    const user = await createUser('Student');

    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-here@example.com', password: TEST_PASSWORD });
    const wrong = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual({ success: false, message: 'Invalid credentials' });
    expect(wrong.body).toEqual(unknown.body);
  });

  it('rejects operator objects instead of strings (NoSQL injection cannot pick an account)', async () => {
    await createUser('Super Admin');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it(`locks the email for a while after ${MAX_FAILED_ATTEMPTS} wrong passwords (429), even with the right one`, async () => {
    const user = await createUser('Student');

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong' })
        .expect(401);
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD });

    expect(res.status).toBe(429);
    expect(res.body.message).toBe('Too many failed login attempts. Please try again later.');
  });

  it('a burst of parallel wrong logins cannot slip past the limit', async () => {
    const user = await createUser('Student');
    const BURST = 20;

    const results = await Promise.all(
      Array.from({ length: BURST }, () =>
        request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' }),
      ),
    );

    const locked = results.filter((res) => res.status === 429).length;
    expect(locked).toBeGreaterThanOrEqual(BURST - MAX_FAILED_ATTEMPTS);
  });

  it('a successful login resets the failed-attempt count', async () => {
    const user = await createUser('Student');

    for (let attempt = 0; attempt < MAX_FAILED_ATTEMPTS - 1; attempt += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong' })
        .expect(401);
    }
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: TEST_PASSWORD })
      .expect(200);
    const afterReset = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong' });

    expect(afterReset.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the token cookie (anyone may call it)', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Logged out successfully' });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^token=;/);
    expect(cookie).toContain('Expires=Thu, 01 Jan 1970');
  });
});

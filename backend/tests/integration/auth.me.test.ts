import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { config } from '../../src/config/env';
import { User } from '../../src/models/User.model';
import { authCookie, bearer, createUser, PNG_BYTES, TEST_PASSWORD } from '../factories';
import { mockCloudinary } from '../helpers/cloudinary';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/auth/me', () => {
  it('returns the signed-in user from the token cookie, without the password', async () => {
    const user = await createUser('Moderator');

    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie(user));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      _id: String(user._id),
      email: user.email,
      role: 'Moderator',
    });
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.passwordChangedAt).toBeUndefined();
  });

  it('also accepts an Authorization: Bearer header', async () => {
    const user = await createUser('Student');

    const res = await request(app).get('/api/auth/me').set('Authorization', bearer(user));

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Not authorized, please login' });
  });

  it.each([
    ['a malformed token', 'token=not-a-jwt'],
    [
      'a token signed with another secret',
      `token=${jwt.sign({ id: '000000000000000000000000' }, 'other-secret')}`,
    ],
    [
      'an expired token',
      `token=${jwt.sign({ id: '000000000000000000000000' }, config.jwtSecret, { expiresIn: -10 })}`,
    ],
  ])('answers 401 (not 500) for %s', async (_case, cookie) => {
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Not authorized, please login' });
  });

  it('answers 401 when the user was deleted', async () => {
    const user = await createUser('Student');
    const cookie = authCookie(user);
    await User.deleteOne({ _id: user._id });

    const res = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('User no longer exists');
  });
});

describe('PUT /api/auth/me', () => {
  it('updates the name (trimmed)', async () => {
    const user = await createUser('Teacher');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ name: '  New Name ' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: 'Profile updated',
      data: { name: 'New Name' },
    });
  });

  it('answers 400 for an empty name', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ name: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Name is required');
  });

  it('answers 400 for a non-string field (no crash)', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: { $ne: null } });

    expect(res.status).toBe(400);
  });

  it('lets a student change their email (normalised) with the current password', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: ' Changed.Address@Example.com ', currentPassword: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('changed.address@example.com');
  });

  it.each(['Super Admin', 'Admin', 'Moderator', 'Teacher'] as const)(
    'answers 403 when a %s tries to change their email',
    async (role) => {
      const user = await createUser(role);

      const res = await request(app)
        .put('/api/auth/me')
        .set('Cookie', authCookie(user))
        .send({ email: 'elsewhere@example.com' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Only students can update their email from profile');
    },
  );

  it('answers 400 when the new email belongs to someone else', async () => {
    const other = await createUser('Student');
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: other.email, currentPassword: TEST_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is already in use');
  });

  it('changing the email needs the correct current password (a stolen session cannot move the account)', async () => {
    const user = await createUser('Student');

    const missing = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: 'moved-away@example.com' });
    const wrong = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: 'moved-away@example.com', currentPassword: 'wrong-one' });

    expect(missing.status).toBe(400);
    expect(missing.body.message).toBe('Current password is required');
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toBe('Current password is incorrect');
    expect((await User.findById(user._id))?.email).toBe(user.email);
  });

  it('sending the unchanged email needs no password', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ email: user.email });

    expect(res.status).toBe(200);
  });

  it('a password with spaces at the ends works for login after the change (hashed exactly as typed)', async () => {
    const user = await createUser('Student');

    await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ currentPassword: TEST_PASSWORD, newPassword: ' spaced pass ' })
      .expect(200);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: ' spaced pass ' });

    expect(login.status).toBe(200);
  });

  it('password change needs the current password', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ newPassword: 'Another-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Current password is required');
  });

  it('password change answers 400 for a wrong current password', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ currentPassword: 'wrong', newPassword: 'Another-1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Current password is incorrect');
  });

  it('password change answers 400 for a new password under 6 characters', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ currentPassword: TEST_PASSWORD, newPassword: '123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('New password must be 6-72 characters');
  });

  it('password change: new password works, old tokens are revoked, this session gets a fresh cookie', async () => {
    const user = await createUser('Student');
    // A token issued well before the change (another device)
    const oldToken = jwt.sign(
      { id: String(user._id), iat: Math.floor(Date.now() / 1000) - 60 },
      config.jwtSecret,
    );

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', `token=${oldToken}`)
      .send({ currentPassword: TEST_PASSWORD, newPassword: 'Brand-new-pass-1' });

    expect(res.status).toBe(200);
    const freshCookie = String(res.headers['set-cookie']).split(';')[0];
    expect(freshCookie).toMatch(/^token=.+/);

    const withOld = await request(app).get('/api/auth/me').set('Cookie', `token=${oldToken}`);
    const withFresh = await request(app).get('/api/auth/me').set('Cookie', freshCookie);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Brand-new-pass-1' });

    expect(withOld.status).toBe(401);
    expect(withFresh.status).toBe(200);
    expect(login.status).toBe(200);
  });

  it('uploads a new avatar to Cloudinary and stores its URL', async () => {
    const cloudinary = mockCloudinary();
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .attach('avatar', PNG_BYTES, { filename: 'me.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(cloudinary.upload).toHaveBeenCalledOnce();
    expect(res.body.data.avatar).toMatch(
      /^https:\/\/res\.cloudinary\.com\/test-cloud\/medhabee\/users\//,
    );
    expect(res.body.data.avatarPublicId).toBeUndefined();
  });

  it('replacing an avatar deletes the old one; removeAvatar=true clears it', async () => {
    const cloudinary = mockCloudinary();
    const user = await createUser('Student', {
      avatar: 'https://old.example/a.png',
      avatarPublicId: 'medhabee/users/old',
    });

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .field('removeAvatar', 'true');

    expect(res.status).toBe(200);
    expect(cloudinary.destroy).toHaveBeenCalledWith('medhabee/users/old');
    expect(res.body.data.avatar).toBeUndefined();
  });

  it('answers 400 for a non-image avatar', async () => {
    mockCloudinary();
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .attach('avatar', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Only image files are allowed');
  });

  it('switches the community profile to private', async () => {
    const user = await createUser('Student');

    const res = await request(app)
      .put('/api/auth/me')
      .set('Cookie', authCookie(user))
      .send({ isCommunityProfilePrivate: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.data.isCommunityProfilePrivate).toBe(true);
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).put('/api/auth/me').send({ name: 'x' });

    expect(res.status).toBe(401);
  });
});

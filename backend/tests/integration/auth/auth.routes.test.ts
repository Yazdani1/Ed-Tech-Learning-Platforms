import request from 'supertest';
import app from '../../../src/app';
import { User } from '../../../src/models/User.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('registers a student with valid data and returns a token plus safe user data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Password123!',
      });

      expectSuccess(res, 201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.data).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'Student',
      });
      expect(res.body.data.password).toBeUndefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it.each([
      ['missing name', { email: 'ada@example.com', password: 'Password123!' }],
      ['missing email', { name: 'Ada Lovelace', password: 'Password123!' }],
      ['missing password', { name: 'Ada Lovelace', email: 'ada@example.com' }],
    ])('rejects %s', async (_caseName, payload) => {
      const res = await request(app).post('/api/auth/register').send(payload);

      expectError(res, 400, /Name, email and password are required/);
    });

    it('rejects duplicate email addresses', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        password: 'Password123!',
      });

      expectError(res, 400, /Email is already registered/);
    });

    it('normalizes email case through the user schema', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Case User',
        email: 'CASE@EXAMPLE.COM',
        password: 'Password123!',
      });

      expectSuccess(res, 201);
      const user = await User.findOne({ email: 'case@example.com' });
      expect(user).not.toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await createTestUser({ email: 'login@example.com', password: 'Password123!' });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'Password123!',
      });

      expectSuccess(res);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.data.email).toBe('login@example.com');
    });

    it.each([
      ['missing email', { password: 'Password123!' }],
      ['missing password', { email: 'login@example.com' }],
    ])('rejects %s', async (_caseName, payload) => {
      const res = await request(app).post('/api/auth/login').send(payload);

      expectError(res, 400, /Email and password are required/);
    });

    it('rejects an unknown email without leaking account existence detail', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'Password123!',
      });

      expectError(res, 401, /Invalid credentials/);
    });

    it('rejects an incorrect password', async () => {
      await createTestUser({ email: 'login@example.com', password: 'Password123!' });

      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'WrongPassword123!',
      });

      expectError(res, 401, /Invalid credentials/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for a valid bearer token', async () => {
      const user = await createTestUser({ email: 'me@example.com' });

      const res = await request(app).get('/api/auth/me').set(authHeaderFor(user));

      expectSuccess(res);
      expect(res.body.data.email).toBe('me@example.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('rejects missing, malformed, and orphaned tokens', async () => {
      const missing = await request(app).get('/api/auth/me');
      expectError(missing, 401, /Not authorized/);

      const malformed = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token');
      expectError(malformed, 500, /Internal Server Error/);

      const user = await createTestUser({ email: 'deleted@example.com' });
      const headers = authHeaderFor(user);
      await User.findByIdAndDelete(user._id);

      const orphaned = await request(app).get('/api/auth/me').set(headers);
      expectError(orphaned, 401, /User no longer exists/);
    });
  });

  describe('PUT /api/auth/me', () => {
    it('updates student profile fields and password with correct current password', async () => {
      const user = await createTestUser({
        email: 'profile@example.com',
        password: 'OldPassword123!',
      });

      const res = await request(app).put('/api/auth/me').set(authHeaderFor(user)).send({
        name: 'Updated Student',
        email: 'updated@example.com',
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        isCommunityProfilePrivate: 'true',
      });

      expectSuccess(res);
      expect(res.body.data).toMatchObject({
        name: 'Updated Student',
        email: 'updated@example.com',
        isCommunityProfilePrivate: true,
      });
    });

    it('rejects empty names, duplicate emails, and incorrect current passwords', async () => {
      const user = await createTestUser({ email: 'profile@example.com' });
      await createTestUser({ email: 'taken@example.com' });

      const emptyName = await request(app).put('/api/auth/me').set(authHeaderFor(user)).send({ name: '   ' });
      expectError(emptyName, 400, /Name is required/);

      const duplicateEmail = await request(app).put('/api/auth/me').set(authHeaderFor(user)).send({ email: 'taken@example.com' });
      expectError(duplicateEmail, 400, /Email is already in use/);

      const wrongPassword = await request(app).put('/api/auth/me').set(authHeaderFor(user)).send({
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      });
      expectError(wrongPassword, 400, /Current password is incorrect/);
    });

    it('rejects profile update password and email edge cases', async () => {
      const student = await createTestUser({ email: 'student.profile@example.com', password: 'OldPassword123!' });
      const admin = await createTestUser({ role: 'Admin', email: 'admin.profile@example.com' });

      const missingCurrentPassword = await request(app).put('/api/auth/me').set(authHeaderFor(student)).send({
        newPassword: 'NewPassword123!',
      });
      expectError(missingCurrentPassword, 400, /Current password is required/);

      const shortPassword = await request(app).put('/api/auth/me').set(authHeaderFor(student)).send({
        currentPassword: 'OldPassword123!',
        newPassword: 'short',
      });
      expectError(shortPassword, 400, /at least 6 characters/);

      const emptyEmail = await request(app).put('/api/auth/me').set(authHeaderFor(student)).send({ email: '   ' });
      expectError(emptyEmail, 400, /Email is required/);

      const adminEmailUpdate = await request(app).put('/api/auth/me').set(authHeaderFor(admin)).send({
        email: 'new.admin@example.com',
      });
      expectError(adminEmailUpdate, 403, /Only students can update their email/);
    });

    it('uploads and removes avatars through the Cloudinary adapter', async () => {
      const user = await createTestUser({ email: 'avatar@example.com' });

      const upload = await request(app)
        .put('/api/auth/me')
        .set(authHeaderFor(user))
        .attach('avatar', Buffer.from('fake image'), {
          filename: 'avatar.png',
          contentType: 'image/png',
        });

      expectSuccess(upload);
      expect(upload.body.data.avatar).toContain('cloudinary.com');

      const remove = await request(app)
        .put('/api/auth/me')
        .set(authHeaderFor(user))
        .field('removeAvatar', 'true');

      expectSuccess(remove);
      expect(remove.body.data.avatar).toBeUndefined();
    });

    it('rejects non-image avatar files', async () => {
      const user = await createTestUser({ email: 'file@example.com' });

      const res = await request(app)
        .put('/api/auth/me')
        .set(authHeaderFor(user))
        .attach('avatar', Buffer.from('not an image'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        });

      expectError(res, 400, /Only image files are allowed/);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the auth cookie', async () => {
      const user = await createTestUser({ email: 'logout@example.com' });

      const res = await request(app).post('/api/auth/logout').set(authHeaderFor(user));

      expectSuccess(res);
      expect(String(res.headers['set-cookie'])).toContain('token=;');
    });
  });
});

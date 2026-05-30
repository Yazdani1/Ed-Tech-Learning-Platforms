import request from 'supertest';
import app from '../../../src/app';
import { User } from '../../../src/models/User.model';
import { authHeaderFor, createAuthedUser, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Users API', () => {
  it('allows admins to create users with a valid role and safe response', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const res = await request(app).post('/api/users').set(authHeaderFor(admin)).send({
      name: 'Teacher One',
      email: 'teacher.one@example.com',
      password: 'Password123!',
      role: 'Teacher',
    });

    expectSuccess(res, 201);
    expect(res.body.data).toMatchObject({
      name: 'Teacher One',
      email: 'teacher.one@example.com',
      role: 'Teacher',
    });
    expect(res.body.data.password).toBeUndefined();
  });

  it.each([
    ['missing name', { email: 'new@example.com', password: 'Password123!' }],
    ['missing email', { name: 'New User', password: 'Password123!' }],
    ['missing password', { name: 'New User', email: 'new@example.com' }],
  ])('rejects create user with %s', async (_caseName, payload) => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const res = await request(app).post('/api/users').set(authHeaderFor(admin)).send(payload);

    expectError(res, 400, /Name, email and password are required/);
  });

  it('falls back to Student for invalid create role instead of persisting arbitrary roles', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const res = await request(app).post('/api/users').set(authHeaderFor(admin)).send({
      name: 'Invalid Role',
      email: 'invalid-role@example.com',
      password: 'Password123!',
      role: 'Owner',
    });

    expectSuccess(res, 201);
    expect(res.body.data.role).toBe('Student');
  });

  it('lists users with pagination, search, and role filters', async () => {
    const { headers } = await createAuthedUser({ role: 'Super Admin', email: 'super@example.com' });
    await createTestUser({ name: 'Searchable Teacher', email: 'teacher@example.com', role: 'Teacher' });
    await createTestUser({ name: 'Hidden Student', email: 'student@example.com', role: 'Student' });

    const res = await request(app)
      .get('/api/users?search=searchable&role=Teacher&page=1&limit=5')
      .set(headers);

    expectSuccess(res);
    expect(res.body.total).toBe(1);
    expect(res.body.data[0]).toMatchObject({ name: 'Searchable Teacher', role: 'Teacher' });
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5, total: 1 });
  });

  it('gets, updates, updates role, and deletes a user with authorization rules', async () => {
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const user = await createTestUser({ email: 'managed@example.com' });

    const get = await request(app).get(`/api/users/${user._id}`).set(authHeaderFor(superAdmin));
    expectSuccess(get);
    expect(get.body.data.email).toBe('managed@example.com');

    const update = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(superAdmin)).send({
      name: 'Managed Updated',
      email: 'managed.updated@example.com',
      role: 'Moderator',
    });
    expectSuccess(update);
    expect(update.body.data).toMatchObject({ name: 'Managed Updated', role: 'Moderator' });

    const role = await request(app).put(`/api/users/${user._id}/role`).set(authHeaderFor(superAdmin)).send({ role: 'Teacher' });
    expectSuccess(role);
    expect(role.body.data.role).toBe('Teacher');

    const remove = await request(app).delete(`/api/users/${user._id}`).set(authHeaderFor(superAdmin));
    expectSuccess(remove);
    expect(await User.findById(user._id)).toBeNull();
  });

  it('handles invalid ids, not found records, duplicate emails, invalid roles, and delete permissions', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const user = await createTestUser({ email: 'managed@example.com' });
    await createTestUser({ email: 'taken@example.com' });

    const invalidId = await request(app).get('/api/users/not-an-id').set(authHeaderFor(admin));
    expectError(invalidId, 400, /Invalid _id/);

    const notFound = await request(app).get(`/api/users/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(notFound, 404, /User not found/);

    const duplicate = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ email: 'taken@example.com' });
    expectError(duplicate, 400, /Email is already in use/);

    const invalidRole = await request(app).put(`/api/users/${user._id}/role`).set(authHeaderFor(admin)).send({ role: 'Owner' });
    expectError(invalidRole, 400, /Invalid role/);

    const adminDelete = await request(app).delete(`/api/users/${user._id}`).set(authHeaderFor(admin));
    expectError(adminDelete, 403, /not authorized/);

    const superDeleteMissing = await request(app).delete(`/api/users/${makeObjectId()}`).set(authHeaderFor(superAdmin));
    expectError(superDeleteMissing, 404, /User not found/);
  });
});

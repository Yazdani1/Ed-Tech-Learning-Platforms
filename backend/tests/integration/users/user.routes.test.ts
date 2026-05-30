import request from 'supertest';
import app from '../../../src/app';
import { Enrollment } from '../../../src/models/Enrollment.model';
import { Subscription } from '../../../src/models/Subscription.model';
import { User } from '../../../src/models/User.model';
import { authHeaderFor, createAuthedUser, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createCourse, createSubscriptionPlan, makeObjectId } from '../../helpers/data.helper';

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

  it('includes enrollment and spending summaries for Super Admin user lists', async () => {
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const student = await createTestUser({ name: 'Revenue Student', email: 'revenue.student@example.com', role: 'Student' });
    const course = await createCourse(superAdmin, { price: 75, pricing: 'Paid' });
    await Enrollment.create({ student: student._id, course: course._id, enrollmentType: 'paid', paidPrice: 60 });
    await createSubscriptionPlan(superAdmin, { plan: 'Premium', price: 29 });
    await Subscription.create({
      user: student._id,
      plan: 'Premium',
      pricePaid: 25,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'Active',
      assignedBy: superAdmin._id,
    });

    const res = await request(app).get('/api/users?search=Revenue&page=10&limit=1').set(authHeaderFor(superAdmin));

    expectSuccess(res);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.data[0].enrollmentSummary).toMatchObject({ paid: 1, total: 1 });
    expect(res.body.data[0].spendingSummary).toMatchObject({ paidCourses: 60, subscriptions: 25, total: 85 });
  });

  it('applies Super Admin advanced user filters', async () => {
    const superAdmin = await createTestUser({ role: 'Super Admin', email: 'super@example.com' });
    const activeStudent = await createTestUser({ name: 'Active Paid', email: 'active.paid@example.com', role: 'Student' });
    const expiredStudent = await createTestUser({ name: 'Expired Free', email: 'expired.free@example.com', role: 'Student' });
    const emptyStudent = await createTestUser({ name: 'Empty Student', email: 'empty.student@example.com', role: 'Student' });
    const paidCourse = await createCourse(superAdmin, { price: 100, pricing: 'Paid' });
    const freeCourse = await createCourse(superAdmin);
    await Enrollment.create({ student: activeStudent._id, course: paidCourse._id, enrollmentType: 'paid', paidPrice: 80 });
    await Enrollment.create({ student: expiredStudent._id, course: freeCourse._id, enrollmentType: 'free' });
    await createSubscriptionPlan(superAdmin, { plan: 'Premium', price: 30 });
    await Subscription.create({
      user: activeStudent._id,
      plan: 'Premium',
      pricePaid: 30,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: 'Active',
      assignedBy: superAdmin._id,
    });
    await Subscription.create({
      user: expiredStudent._id,
      plan: 'Premium',
      pricePaid: 15,
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'Expired',
      assignedBy: superAdmin._id,
    });

    const cases = [
      'subscriptionStatus=expired',
      'subscriptionStatus=inactive',
      'enrollmentFilter=has_total',
      'enrollmentFilter=has_free',
      'enrollmentFilter=none_free',
      'enrollmentFilter=none_paid',
      'enrollmentFilter=has_subscription',
      'enrollmentFilter=none_subscription',
      'spendingFilter=has_paid_course',
      'spendingFilter=none_paid_course',
      'spendingFilter=has_subscription',
      'spendingFilter=none_subscription',
      'minTotalSpent=1&maxTotalSpent=200',
      'minPaidCourseSpend=1&maxPaidCourseSpend=100',
      'minSubscriptionSpend=1&maxSubscriptionSpend=50',
    ];

    for (const query of cases) {
      const res = await request(app).get(`/api/users?${query}&limit=5`).set(authHeaderFor(superAdmin));
      expectSuccess(res);
      expect(res.body.pagination).toEqual(expect.objectContaining({ limit: 5 }));
    }

    expect(String(emptyStudent._id)).toBeTruthy();
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

    const emptyName = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ name: '   ' });
    expectError(emptyName, 400, /Name is required/);

    const emptyEmail = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ email: '   ' });
    expectError(emptyEmail, 400, /Email is required/);

    const invalidUpdateRole = await request(app).put(`/api/users/${user._id}`).set(authHeaderFor(admin)).send({ role: 'Owner' });
    expectError(invalidUpdateRole, 400, /Invalid role/);

    const missingUpdate = await request(app).put(`/api/users/${makeObjectId()}`).set(authHeaderFor(admin)).send({ name: 'Missing' });
    expectError(missingUpdate, 404, /User not found/);

    const missingRoleUpdate = await request(app).put(`/api/users/${makeObjectId()}/role`).set(authHeaderFor(admin)).send({ role: 'Teacher' });
    expectError(missingRoleUpdate, 404, /User not found/);

    const invalidRole = await request(app).put(`/api/users/${user._id}/role`).set(authHeaderFor(admin)).send({ role: 'Owner' });
    expectError(invalidRole, 400, /Invalid role/);

    const adminDelete = await request(app).delete(`/api/users/${user._id}`).set(authHeaderFor(admin));
    expectError(adminDelete, 403, /not authorized/);

    const superDeleteMissing = await request(app).delete(`/api/users/${makeObjectId()}`).set(authHeaderFor(superAdmin));
    expectError(superDeleteMissing, 404, /User not found/);
  });
});

import request from 'supertest';
import app from '../../../src/app';
import { Subscription } from '../../../src/models/Subscription.model';
import { User } from '../../../src/models/User.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { createSubscriptionPlan, makeObjectId } from '../../helpers/data.helper';

describe('Subscription Plan Config API', () => {
  it('lists plans publicly and lets admins upsert and delete plan configs', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    await createSubscriptionPlan(admin);

    const list = await request(app).get('/api/subscription-plans');
    expectSuccess(list);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0]).toMatchObject({ plan: 'Premium', courseCount: 0 });

    const upsert = await request(app).post('/api/subscription-plans').set(authHeaderFor(admin)).send({
      plan: 'Ultimate',
      billingOptions: [
        { label: 'Monthly', duration: 1, price: 49 },
        { label: 'Annual', duration: 12, price: 399 },
      ],
      features: ['Everything'],
      badge: 'Best',
      color: '#111111',
    });
    expectSuccess(upsert);
    expect(upsert.body.data).toMatchObject({ plan: 'Ultimate', price: 49, duration: 1 });

    const remove = await request(app).delete(`/api/subscription-plans/${upsert.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
  });

  it('rejects invalid plan config payloads and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const missing = await request(app).post('/api/subscription-plans').set(authHeaderFor(admin)).send({ plan: 'Broken' });
    expectError(missing, 400, /plan and at least one billing option are required/);

    const missingDelete = await request(app).delete(`/api/subscription-plans/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingDelete, 404, /Plan config not found/);
  });
});

describe('Subscriptions API', () => {
  it('lets students subscribe, read their subscription, replace active subscriptions, and cancel their own plan', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    await createSubscriptionPlan(admin);

    const subscribe = await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(student)).send({
      plan: 'Premium',
      billingDuration: 1,
    });
    expectSuccess(subscribe, 201);
    expect(subscribe.body.data).toMatchObject({
      plan: 'Premium',
      billingDuration: 1,
      billingLabel: 'Monthly',
      pricePaid: 29,
      status: 'Active',
    });

    const my = await request(app).get('/api/subscriptions/my').set(authHeaderFor(student));
    expectSuccess(my);
    expect(my.body.data.plan).toBe('Premium');

    const second = await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(student)).send({ plan: 'Premium' });
    expectSuccess(second, 201);
    expect(await Subscription.countDocuments({ user: student._id, status: 'Active' })).toBe(1);

    const cancel = await request(app).delete('/api/subscriptions/cancel-my').set(authHeaderFor(student));
    expectSuccess(cancel);
    expect(await Subscription.countDocuments({ user: student._id, status: 'Active' })).toBe(0);

    const updatedUser = await User.findById(student._id);
    expect(updatedUser?.activeSubscription?.plan).toBeUndefined();
  });

  it('validates student subscription payloads, billing options, and empty active cancellation', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    await createSubscriptionPlan(admin);

    const missingPlan = await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(student)).send({});
    expectError(missingPlan, 400, /plan is required/);

    const unavailablePlan = await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(student)).send({ plan: 'Missing' });
    expectError(unavailablePlan, 404, /Subscription plan not available/);

    const unavailableBilling = await request(app).post('/api/subscriptions/subscribe').set(authHeaderFor(student)).send({
      plan: 'Premium',
      billingDuration: 12,
    });
    expectError(unavailableBilling, 404, /Billing option not available/);

    const noActive = await request(app).delete('/api/subscriptions/cancel-my').set(authHeaderFor(student));
    expectError(noActive, 404, /No active subscription found/);
  });

  it('lets admins list, assign, filter, and cancel subscriptions with validation', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    await createSubscriptionPlan(admin);

    const assign = await request(app).post('/api/subscriptions/assign').set(authHeaderFor(admin)).send({
      userId: String(student._id),
      plan: 'Premium',
      billingDuration: 1,
      endDate: '2030-01-01T00:00:00.000Z',
    });
    expectSuccess(assign, 201);
    expect(assign.body.data.assignedBy).toBe(String(admin._id));

    const list = await request(app).get('/api/subscriptions?status=active&plan=Premium&page=1&limit=5&search=student').set(authHeaderFor(admin));
    expectSuccess(list);
    expect(list.body.total).toBe(1);
    expect(list.body.statusCounts.active).toBe(1);

    const cancel = await request(app).patch(`/api/subscriptions/${assign.body.data._id}/cancel`).set(authHeaderFor(admin));
    expectSuccess(cancel);
    expect(await Subscription.countDocuments({ user: student._id, status: 'Cancelled' })).toBe(1);

    const missingFields = await request(app).post('/api/subscriptions/assign').set(authHeaderFor(admin)).send({ userId: String(student._id) });
    expectError(missingFields, 400, /userId, plan and endDate are required/);

    const missingUser = await request(app).post('/api/subscriptions/assign').set(authHeaderFor(admin)).send({
      userId: makeObjectId(),
      plan: 'Premium',
      endDate: '2030-01-01T00:00:00.000Z',
    });
    expectError(missingUser, 404, /User not found/);

    const missingCancel = await request(app).patch(`/api/subscriptions/${makeObjectId()}/cancel`).set(authHeaderFor(admin));
    expectError(missingCancel, 404, /Subscription not found/);
  });
});

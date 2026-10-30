import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Subscription } from '../../src/models/Subscription.model';
import { User } from '../../src/models/User.model';
import { authCookie, bearer, createUser, ROLES } from '../factories';
import { createPlanConfig, createSubscriptionDoc } from '../factories/quiz-subscription';

const BASE = '/api/subscriptions';

describe('GET /api/subscriptions/my', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(`${BASE}/my`)).status).toBe(401);
  });

  it('null when the user has no active subscription (any role, Bearer too)', async () => {
    for (const role of ROLES) {
      const user = await createUser(role);
      const res = await request(app).get(`${BASE}/my`).set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: null });
    }
    const user = await createUser('Student');
    const res = await request(app).get(`${BASE}/my`).set('Authorization', bearer(user));
    expect(res.status).toBe(200);
  });

  it('returns only my own active subscription (not cancelled, not other users)', async () => {
    const me = await createUser('Student');
    const other = await createUser('Student');
    await createSubscriptionDoc(me, { status: 'Cancelled', plan: 'Old' });
    const active = await createSubscriptionDoc(me, { plan: 'Current' });
    await createSubscriptionDoc(other, { plan: 'Theirs' });
    const res = await request(app).get(`${BASE}/my`).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(String(active._id));
    expect(res.body.data.plan).toBe('Current');
  });
});

describe('POST /api/subscriptions/subscribe', () => {
  it('401 without a token', async () => {
    expect((await request(app).post(`${BASE}/subscribe`).send({ plan: 'x' })).status).toBe(401);
  });

  it('403 for every role except Student', async () => {
    const plan = await createPlanConfig();
    for (const role of ROLES.filter((r) => r !== 'Student')) {
      const user = await createUser(role);
      const res = await request(app)
        .post(`${BASE}/subscribe`)
        .set('Cookie', authCookie(user))
        .send({ plan: plan.plan });
      expect(res.status).toBe(403);
      expect(await Subscription.countDocuments({ user: user._id })).toBe(0);
    }
  });

  it('activates the plan using the price from the database, ignoring price sent by the client', async () => {
    const plan = await createPlanConfig();
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/subscribe`)
      .set('Cookie', authCookie(student))
      .send({
        plan: plan.plan,
        price: 1,
        pricePaid: 1,
        status: 'Active',
        assignedBy: 'x',
        endDate: '2001-01-01',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Subscribed successfully');
    expect(res.body.data.pricePaid).toBe(500);
    expect(res.body.data.billingDuration).toBe(1);
    expect(res.body.data.billingLabel).toBe('Monthly');
    expect(res.body.data.status).toBe('Active');
    expect(new Date(res.body.data.endDate).getTime()).toBeGreaterThan(Date.now());
    const sub = await Subscription.findById(res.body.data._id);
    expect(String(sub?.user)).toBe(String(student._id));
    expect(String(sub?.assignedBy)).toBe(String(student._id));
    const user = await User.findById(student._id);
    expect(user?.activeSubscription?.plan).toBe(plan.plan);
    expect(user?.activeSubscription?.billingDuration).toBe(1);
  });

  it('uses the chosen billing option price (12 months) and sets the end date 12 months ahead', async () => {
    const plan = await createPlanConfig();
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/subscribe`)
      .set('Cookie', authCookie(student))
      .send({ plan: plan.plan, billingDuration: 12 });
    expect(res.status).toBe(201);
    expect(res.body.data.pricePaid).toBe(4800);
    expect(res.body.data.billingLabel).toBe('Yearly');
    const months =
      (new Date(res.body.data.endDate).getFullYear() - new Date().getFullYear()) * 12 +
      new Date(res.body.data.endDate).getMonth() -
      new Date().getMonth();
    expect(months).toBe(12);
  });

  it('subscribing again cancels the previous active subscription (one active at a time)', async () => {
    const plan = await createPlanConfig();
    const student = await createUser('Student');
    const old = await createSubscriptionDoc(student, { plan: 'Old' });
    const res = await request(app)
      .post(`${BASE}/subscribe`)
      .set('Cookie', authCookie(student))
      .send({ plan: plan.plan });
    expect(res.status).toBe(201);
    expect((await Subscription.findById(old._id))?.status).toBe('Cancelled');
    expect(await Subscription.countDocuments({ user: student._id, status: 'Active' })).toBe(1);
  });

  it('400 when plan is missing', async () => {
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/subscribe`)
      .set('Cookie', authCookie(student))
      .send({});
    expect(res.status).toBe(400);
  });

  it('404 for an unknown or inactive plan or an unknown billing duration; nothing saved', async () => {
    const inactive = await createPlanConfig({ isActive: false });
    const plan = await createPlanConfig();
    const student = await createUser('Student');
    const cookie = authCookie(student);
    const post = (body: object) =>
      request(app).post(`${BASE}/subscribe`).set('Cookie', cookie).send(body);
    expect((await post({ plan: 'Does not exist' })).status).toBe(404);
    expect((await post({ plan: inactive.plan })).status).toBe(404);
    expect((await post({ plan: plan.plan, billingDuration: 7 })).status).toBe(404);
    expect(await Subscription.countDocuments({ user: student._id })).toBe(0);
  });

  it('does not treat an operator object as the plan name (no match, not a 500, nothing saved)', async () => {
    await createPlanConfig();
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/subscribe`)
      .set('Cookie', authCookie(student))
      .send({ plan: { $ne: null } });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Subscription plan not available');
    expect(await Subscription.countDocuments({ user: student._id })).toBe(0);
  });
});

describe('DELETE /api/subscriptions/cancel-my', () => {
  it('401 without a token', async () => {
    expect((await request(app).delete(`${BASE}/cancel-my`)).status).toBe(401);
  });

  it('403 for every role except Student', async () => {
    for (const role of ROLES.filter((r) => r !== 'Student')) {
      const user = await createUser(role);
      expect(
        (await request(app).delete(`${BASE}/cancel-my`).set('Cookie', authCookie(user))).status,
      ).toBe(403);
    }
  });

  it('cancels my active subscription, clears the user summary and leaves other users alone', async () => {
    const me = await createUser('Student');
    const other = await createUser('Student');
    const mine = await createSubscriptionDoc(me);
    const theirs = await createSubscriptionDoc(other);
    await User.findByIdAndUpdate(me._id, {
      activeSubscription: { plan: 'P', startDate: new Date(), endDate: new Date() },
    });
    const res = await request(app).delete(`${BASE}/cancel-my`).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Subscription cancelled');
    expect((await Subscription.findById(mine._id))?.status).toBe('Cancelled');
    expect((await Subscription.findById(theirs._id))?.status).toBe('Active');
    expect((await User.findById(me._id))?.activeSubscription?.plan).toBeUndefined();
  });

  it('404 when there is no active subscription', async () => {
    const me = await createUser('Student');
    await createSubscriptionDoc(me, { status: 'Cancelled' });
    const res = await request(app).delete(`${BASE}/cancel-my`).set('Cookie', authCookie(me));
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('No active subscription found');
  });
});

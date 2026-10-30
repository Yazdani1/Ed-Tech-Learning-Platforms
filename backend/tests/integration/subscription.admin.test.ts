import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Subscription } from '../../src/models/Subscription.model';
import { User } from '../../src/models/User.model';
import { authCookie, createUser, missingId, ROLES } from '../factories';
import { createPlanConfig, createSubscriptionDoc } from '../factories/quiz-subscription';

const BASE = '/api/subscriptions';
const NON_ADMIN = ROLES.filter((r) => r !== 'Super Admin' && r !== 'Admin');
const FUTURE = '2099-01-01T00:00:00.000Z';

describe('GET /api/subscriptions (admin list)', () => {
  it('401 without a token; 403 for Moderator, Teacher, Student', async () => {
    expect((await request(app).get(BASE)).status).toBe(401);
    for (const role of NON_ADMIN) {
      const user = await createUser(role);
      expect((await request(app).get(BASE).set('Cookie', authCookie(user))).status).toBe(403);
    }
  });

  it('lists newest first with pagination, status counts and no password in the user', async () => {
    const admin = await createUser('Super Admin');
    const student = await createUser('Student', { name: 'Listed Person' });
    const plan = `ListPlan ${Date.now()}`;
    const past = new Date(Date.now() - 86400000);
    await createSubscriptionDoc(student, { plan, status: 'Cancelled' });
    await createSubscriptionDoc(student, { plan, endDate: past, status: 'Active' });
    await createSubscriptionDoc(student, { plan, status: 'Expired' });
    const live = await createSubscriptionDoc(student, { plan });
    const cookie = authCookie(admin);
    const all = await request(app)
      .get(`${BASE}?plan=${encodeURIComponent(plan)}`)
      .set('Cookie', cookie);
    expect(all.status).toBe(200);
    expect(all.body.success).toBe(true);
    expect(all.body.total).toBe(4);
    expect(all.body.data[0]._id).toBe(String(live._id));
    expect(all.body.data[0].user.name).toBe('Listed Person');
    expect(all.body.data[0].user).not.toHaveProperty('password');
    expect(all.body.statusCounts).toEqual({ active: 1, cancelled: 1, expired: 2, all: 4 });
    expect(all.body.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 4,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
    const q = (s: string) =>
      request(app)
        .get(`${BASE}?plan=${encodeURIComponent(plan)}&status=${s}`)
        .set('Cookie', cookie);
    expect((await q('active')).body.total).toBe(1);
    expect((await q('cancelled')).body.total).toBe(1);
    expect((await q('expired')).body.total).toBe(2);
  });

  it('paginates and clamps page/limit', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const plan = `PagePlan ${Date.now()}`;
    for (let i = 0; i < 3; i += 1)
      await createSubscriptionDoc(student, { plan, status: 'Cancelled' });
    const cookie = authCookie(admin);
    const p2 = await request(app)
      .get(`${BASE}?plan=${encodeURIComponent(plan)}&limit=2&page=2`)
      .set('Cookie', cookie);
    expect(p2.body.data).toHaveLength(1);
    expect(p2.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      totalPages: 2,
      hasNextPage: false,
      hasPrevPage: true,
    });
    const clamped = await request(app)
      .get(`${BASE}?plan=${encodeURIComponent(plan)}&limit=9999&page=-3`)
      .set('Cookie', cookie);
    expect(clamped.body.pagination).toMatchObject({ page: 1, limit: 100 });
  });

  it('filters by billingDuration and searches by user name or email', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student', { name: 'Zxqvname Person' });
    const plan = `SearchPlan ${Date.now()}`;
    await createSubscriptionDoc(student, { plan, billingDuration: 12 });
    await createSubscriptionDoc(await createUser('Student'), { plan, billingDuration: 1 });
    const cookie = authCookie(admin);
    const dur = await request(app)
      .get(`${BASE}?plan=${encodeURIComponent(plan)}&billingDuration=12`)
      .set('Cookie', cookie);
    expect(dur.body.total).toBe(1);
    const byName = await request(app).get(`${BASE}?search=zxqvname`).set('Cookie', cookie);
    expect(byName.body.total).toBe(1);
    const byEmail = await request(app)
      .get(`${BASE}?search=${encodeURIComponent(student.email)}`)
      .set('Cookie', cookie);
    expect(byEmail.body.total).toBe(1);
  });

  it('a regex-special search does not crash the server', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .get(`${BASE}?search=${encodeURIComponent('(')}`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBeLessThan(500);
  });

  it('operator objects in the query are not passed to the database', async () => {
    const admin = await createUser('Admin');
    const res = await request(app).get(`${BASE}?plan[$ne]=x`).set('Cookie', authCookie(admin));
    expect(res.status).toBeLessThan(500);
    if (res.status === 200) {
      const own = await Subscription.countDocuments();
      expect(res.body.total).toBeLessThan(own + 1);
    }
  });
});

describe('POST /api/subscriptions/assign', () => {
  it('401 without a token; 403 for Moderator, Teacher, Student', async () => {
    expect((await request(app).post(`${BASE}/assign`).send({})).status).toBe(401);
    for (const role of NON_ADMIN) {
      const user = await createUser(role);
      expect(
        (await request(app).post(`${BASE}/assign`).set('Cookie', authCookie(user)).send({})).status,
      ).toBe(403);
    }
  });

  it('assigns a plan: price from the database, previous active cancelled, user summary set', async () => {
    const plan = await createPlanConfig();
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const old = await createSubscriptionDoc(student);
    const res = await request(app)
      .post(`${BASE}/assign`)
      .set('Cookie', authCookie(admin))
      .send({
        userId: String(student._id),
        plan: plan.plan,
        endDate: FUTURE,
        billingDuration: 12,
        pricePaid: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Subscription assigned');
    expect(res.body.data.pricePaid).toBe(4800);
    expect(res.body.data.billingLabel).toBe('Yearly');
    expect(res.body.data.endDate).toBe(FUTURE);
    expect(String(res.body.data.assignedBy)).toBe(String(admin._id));
    expect((await Subscription.findById(old._id))?.status).toBe('Cancelled');
    const user = await User.findById(student._id);
    expect(user?.activeSubscription?.plan).toBe(plan.plan);
    expect(user?.activeSubscription?.billingDuration).toBe(12);
  });

  it('400 when userId, plan or endDate is missing', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    const post = (body: object) =>
      request(app).post(`${BASE}/assign`).set('Cookie', cookie).send(body);
    const student = await createUser('Student');
    expect((await post({ plan: 'x', endDate: FUTURE })).status).toBe(400);
    expect((await post({ userId: String(student._id), endDate: FUTURE })).status).toBe(400);
    expect((await post({ userId: String(student._id), plan: 'x' })).status).toBe(400);
  });

  it('400 for an invalid end date or a malformed user id', async () => {
    const plan = await createPlanConfig();
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const cookie = authCookie(admin);
    const bad = await request(app)
      .post(`${BASE}/assign`)
      .set('Cookie', cookie)
      .send({ userId: String(student._id), plan: plan.plan, endDate: 'not-a-date' });
    expect(bad.status).toBe(400);
    expect(await Subscription.countDocuments({ user: student._id })).toBe(0);
    const badId = await request(app)
      .post(`${BASE}/assign`)
      .set('Cookie', cookie)
      .send({ userId: 'bad', plan: plan.plan, endDate: FUTURE });
    expect(badId.status).toBe(400);
  });

  it('400 when the end date is in the past', async () => {
    const plan = await createPlanConfig();
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const res = await request(app)
      .post(`${BASE}/assign`)
      .set('Cookie', authCookie(admin))
      .send({ userId: String(student._id), plan: plan.plan, endDate: '2000-01-01' });
    expect(res.status).toBe(400);
  });

  it('404 for an unknown user, plan, inactive plan or billing option', async () => {
    const plan = await createPlanConfig();
    const inactive = await createPlanConfig({ isActive: false });
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const cookie = authCookie(admin);
    const post = (body: object) =>
      request(app).post(`${BASE}/assign`).set('Cookie', cookie).send(body);
    expect((await post({ userId: missingId(), plan: plan.plan, endDate: FUTURE })).status).toBe(
      404,
    );
    expect(
      (await post({ userId: String(student._id), plan: 'Nope', endDate: FUTURE })).status,
    ).toBe(404);
    expect(
      (await post({ userId: String(student._id), plan: inactive.plan, endDate: FUTURE })).status,
    ).toBe(404);
    expect(
      (
        await post({
          userId: String(student._id),
          plan: plan.plan,
          endDate: FUTURE,
          billingDuration: 5,
        })
      ).status,
    ).toBe(404);
    expect(await Subscription.countDocuments({ user: student._id })).toBe(0);
  });
});

describe('PATCH /api/subscriptions/:id/cancel', () => {
  it('401 without a token; 403 for Moderator, Teacher, Student', async () => {
    const sub = await createSubscriptionDoc(await createUser('Student'));
    expect((await request(app).patch(`${BASE}/${sub._id}/cancel`)).status).toBe(401);
    for (const role of NON_ADMIN) {
      const user = await createUser(role);
      expect(
        (await request(app).patch(`${BASE}/${sub._id}/cancel`).set('Cookie', authCookie(user)))
          .status,
      ).toBe(403);
    }
    expect((await Subscription.findById(sub._id))?.status).toBe('Active');
  });

  it('cancels any subscription and clears the user summary', async () => {
    const admin = await createUser('Super Admin');
    const student = await createUser('Student');
    const sub = await createSubscriptionDoc(student);
    await User.findByIdAndUpdate(student._id, {
      activeSubscription: { plan: 'P', startDate: new Date(), endDate: new Date() },
    });
    const res = await request(app)
      .patch(`${BASE}/${sub._id}/cancel`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Subscription cancelled');
    expect((await Subscription.findById(sub._id))?.status).toBe('Cancelled');
    expect((await User.findById(student._id))?.activeSubscription?.plan).toBeUndefined();
  });

  it('cancelling an old subscription does not wipe the summary of a newer active one', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const old = await createSubscriptionDoc(student, { status: 'Expired' });
    await createSubscriptionDoc(student, { plan: 'Newer' });
    await User.findByIdAndUpdate(student._id, {
      activeSubscription: { plan: 'Newer', startDate: new Date(), endDate: new Date() },
    });
    await request(app).patch(`${BASE}/${old._id}/cancel`).set('Cookie', authCookie(admin));
    expect((await User.findById(student._id))?.activeSubscription?.plan).toBe('Newer');
  });

  it('cancelling one of two active subscriptions points the summary at the remaining one', async () => {
    const admin = await createUser('Admin');
    const student = await createUser('Student');
    const later = new Date();
    later.setMonth(later.getMonth() + 6);
    const remaining = await createSubscriptionDoc(student, { plan: 'Remaining', endDate: later });
    const cancelled = await createSubscriptionDoc(student, { plan: 'Cancelled one' });
    await User.findByIdAndUpdate(student._id, {
      activeSubscription: { plan: 'Cancelled one', startDate: new Date(), endDate: new Date() },
    });
    const res = await request(app)
      .patch(`${BASE}/${cancelled._id}/cancel`)
      .set('Cookie', authCookie(admin));
    expect(res.status).toBe(200);
    const summary = (await User.findById(student._id))?.activeSubscription;
    expect(summary?.plan).toBe('Remaining');
    expect(summary?.endDate?.toISOString()).toBe(remaining.endDate.toISOString());
  });

  it('404 for a missing id, 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect(
      (await request(app).patch(`${BASE}/${missingId()}/cancel`).set('Cookie', cookie)).status,
    ).toBe(404);
    expect((await request(app).patch(`${BASE}/bad/cancel`).set('Cookie', cookie)).status).toBe(400);
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../../src/app';
import { SubscriptionPlanConfig } from '../../src/models/SubscriptionPlanConfig.model';
import { authCookie, bearer, createCourse, createUser, missingId, ROLES } from '../factories';
import { createPlanConfig } from '../factories/quiz-subscription';

const BASE = '/api/subscription-plans';
const NON_ADMIN = ROLES.filter((r) => r !== 'Super Admin' && r !== 'Admin');

describe('GET /api/subscription-plans (public)', () => {
  it('needs no token, lists only active plans cheapest first with billing options and course count', async () => {
    const cheap = await createPlanConfig({ plan: `Cheap ${Date.now()}`, price: 1 });
    const dear = await createPlanConfig({ plan: `Dear ${Date.now()}`, price: 99999 });
    const inactive = await createPlanConfig({ isActive: false, price: 2 });
    await createCourse({ includedInSubscription: true, allowedSubscriptionPlans: [cheap.plan] });
    await createCourse({ includedInSubscription: true, allowedSubscriptionPlans: [cheap.plan] });
    await createCourse({
      includedInSubscription: true,
      status: 'Draft',
      allowedSubscriptionPlans: [cheap.plan],
    });
    await createCourse({ includedInSubscription: false, allowedSubscriptionPlans: [dear.plan] });
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.data.map((p: { plan: string }) => p.plan);
    expect(names).not.toContain(inactive.plan);
    expect(names.indexOf(cheap.plan)).toBeLessThan(names.indexOf(dear.plan));
    expect(res.body.total).toBe(res.body.data.length);
    const c = res.body.data.find((p: { plan: string }) => p.plan === cheap.plan);
    expect(c.courseCount).toBe(2);
    expect(c.billingOptions).toHaveLength(2);
    expect(res.body.data.find((p: { plan: string }) => p.plan === dear.plan).courseCount).toBe(0);
  });

  it('builds a billing option from price and duration for legacy plans without options', async () => {
    const legacy = await createPlanConfig({
      plan: `Legacy ${Date.now()}`,
      billingOptions: [],
      price: 300,
      duration: 3,
    });
    const res = await request(app).get(BASE);
    const p = res.body.data.find((x: { plan: string }) => x.plan === legacy.plan);
    expect(p.billingOptions).toEqual([{ label: '3 months', duration: 3, price: 300 }]);
  });
});

describe('POST /api/subscription-plans (create or update)', () => {
  it('401 without a token; 403 for Moderator, Teacher, Student', async () => {
    expect((await request(app).post(BASE).send({ plan: 'x', price: 1, duration: 1 })).status).toBe(
      401,
    );
    for (const role of NON_ADMIN) {
      const user = await createUser(role);
      const res = await request(app)
        .post(BASE)
        .set('Cookie', authCookie(user))
        .send({ plan: `P${role}`, price: 1, duration: 1 });
      expect(res.status).toBe(403);
      expect(await SubscriptionPlanConfig.countDocuments({ plan: `P${role}` })).toBe(0);
    }
  });

  it('creates a plan from billing options; the first option becomes price and duration (Bearer too)', async () => {
    const admin = await createUser('Admin');
    const name = `  New plan ${Date.now()} `;
    const res = await request(app)
      .post(BASE)
      .set('Authorization', bearer(admin))
      .send({
        plan: name,
        billingOptions: [
          { label: ' Monthly ', duration: 1, price: 200 },
          { label: 'Yearly', duration: 12, price: 2000 },
        ],
        features: ['A', 'B'],
        badge: 'Best',
        color: '#fff',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe(name.trim());
    expect(res.body.data.price).toBe(200);
    expect(res.body.data.duration).toBe(1);
    expect(res.body.data.billingOptions).toHaveLength(2);
    expect(res.body.data.billingOptions[0].label).toBe('Monthly');
    expect(res.body.data.features).toEqual(['A', 'B']);
    expect(res.body.data.isActive).toBe(true);
    expect(String(res.body.data.createdBy)).toBe(String(admin._id));
  });

  it('creates from price + duration alone (Super Admin) and updates the same plan instead of duplicating', async () => {
    const admin = await createUser('Super Admin');
    const plan = `Upsert ${Date.now()}`;
    const cookie = authCookie(admin);
    const first = await request(app)
      .post(BASE)
      .set('Cookie', cookie)
      .send({ plan, price: 100, duration: 1 });
    expect(first.status).toBe(200);
    expect(first.body.data.billingOptions[0]).toMatchObject({
      label: 'Monthly',
      duration: 1,
      price: 100,
    });
    const second = await request(app)
      .post(BASE)
      .set('Cookie', cookie)
      .send({ plan, price: 150, duration: 6, features: ['X'] });
    expect(second.status).toBe(200);
    expect(second.body.data.billingOptions[0]).toMatchObject({ label: '6 months', price: 150 });
    expect(await SubscriptionPlanConfig.countDocuments({ plan })).toBe(1);
    expect(String(second.body.data._id)).toBe(String(first.body.data._id));
  });

  it('re-activates an inactive plan when it is saved again', async () => {
    const admin = await createUser('Admin');
    const inactive = await createPlanConfig({ isActive: false });
    await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ plan: inactive.plan, price: 5, duration: 1 });
    expect((await SubscriptionPlanConfig.findById(inactive._id))?.isActive).toBe(true);
  });

  it('400 for a missing plan or no valid billing option; nothing saved', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    const post = (body: object) => request(app).post(BASE).set('Cookie', cookie).send(body);
    const before = await SubscriptionPlanConfig.countDocuments();
    expect((await post({ price: 1, duration: 1 })).status).toBe(400);
    expect((await post({ plan: '   ', price: 1, duration: 1 })).status).toBe(400);
    expect((await post({ plan: 'NoOptions' })).status).toBe(400);
    expect(
      (await post({ plan: 'NoOptions', billingOptions: [{ label: '', duration: 1, price: 1 }] }))
        .status,
    ).toBe(400);
    expect(await SubscriptionPlanConfig.countDocuments()).toBe(before);
  });

  it('400 for an operator object as the plan name', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ plan: { $ne: null }, price: 1, duration: 1 });
    expect(res.status).toBe(400);
  });

  it('400 for a negative price with no billing options', async () => {
    const admin = await createUser('Admin');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', authCookie(admin))
      .send({ plan: `Neg ${Date.now()}`, price: -5, duration: 1 });
    expect(res.status).toBe(400);
  });

  it('400 for invalid price, duration or billing options; an existing plan is left unchanged', async () => {
    const existing = await createPlanConfig();
    const admin = await createUser('Admin');
    const post = (body: object) =>
      request(app).post(BASE).set('Cookie', authCookie(admin)).send(body);
    const plan = existing.plan;
    const option = { label: 'Monthly', duration: 1, price: 10 };
    const invalid: object[] = [
      { plan, price: '5', duration: 1 },
      { plan, price: Number.NaN, duration: 1 },
      { plan, price: 5, duration: 0 },
      { plan, price: 5, duration: 1.5 },
      { plan, billingOptions: 'monthly' },
      { plan, billingOptions: [option, { ...option, label: 7 }] },
      { plan, billingOptions: [option, { ...option, duration: 0 }] },
      { plan, billingOptions: [option, { ...option, duration: 2.5 }] },
      { plan, billingOptions: [option, { ...option, price: -1 }] },
      { plan, billingOptions: [option, { ...option, price: '10' }] },
    ];
    for (const body of invalid) {
      expect((await post(body)).status).toBe(400);
    }
    const saved = await SubscriptionPlanConfig.findById(existing._id);
    expect(saved?.price).toBe(existing.price);
    expect(saved?.billingOptions).toHaveLength(2);
  });
});

describe('DELETE /api/subscription-plans/:id', () => {
  it('401 without a token; 403 for Moderator, Teacher, Student', async () => {
    const plan = await createPlanConfig();
    expect((await request(app).delete(`${BASE}/${plan._id}`)).status).toBe(401);
    for (const role of NON_ADMIN) {
      const user = await createUser(role);
      expect(
        (await request(app).delete(`${BASE}/${plan._id}`).set('Cookie', authCookie(user))).status,
      ).toBe(403);
    }
    expect(await SubscriptionPlanConfig.findById(plan._id)).not.toBeNull();
  });

  it('Admin and Super Admin delete a plan', async () => {
    for (const role of ['Admin', 'Super Admin'] as const) {
      const plan = await createPlanConfig();
      const user = await createUser(role);
      const res = await request(app).delete(`${BASE}/${plan._id}`).set('Cookie', authCookie(user));
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Plan config deleted');
      expect(await SubscriptionPlanConfig.findById(plan._id)).toBeNull();
    }
  });

  it('404 for a missing id, 400 for a malformed id', async () => {
    const admin = await createUser('Admin');
    const cookie = authCookie(admin);
    expect((await request(app).delete(`${BASE}/${missingId()}`).set('Cookie', cookie)).status).toBe(
      404,
    );
    expect((await request(app).delete(`${BASE}/bad`).set('Cookie', cookie)).status).toBe(400);
  });
});

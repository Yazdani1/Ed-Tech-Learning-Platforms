import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { StudySchedule } from '../../src/models/StudySchedule.model';
import { authCookie, bearer, createUser, createUsersForAllRoles, ROLES } from '../factories';
import { createReminderDoc, createTimerDoc, daysFromNow } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/study-schedules';
const TIMER = `${BASE}/timer`;
const REMINDER = `${BASE}/reminder`;
const MAX_TITLE = 200;

let users: Record<UserRole, IUser>;

beforeAll(async () => {
  users = await createUsersForAllRoles();
});

describe('POST /api/study-schedules/timer', () => {
  it('401 without a token', async () => {
    const res = await request(app).post(TIMER).send({ title: 'T', duration: 60 });
    expect(res.status).toBe(401);
  });

  it.each(ROLES)('%s creates a timer for themselves', async (role) => {
    const res = await request(app)
      .post(TIMER)
      .set('Cookie', authCookie(users[role]))
      .send({ title: '  Read  ', description: '  chapter 1 ', duration: 1500 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Timer created' });
    expect(res.body.data).toMatchObject({
      user: String(users[role]._id),
      type: 'timer',
      title: 'Read',
      description: 'chapter 1',
      duration: 1500,
      elapsedSeconds: 0,
      status: 'active',
    });
    const saved = await StudySchedule.findById(res.body.data._id);
    expect(saved?.title).toBe('Read');
  });

  it('defaults the description to an empty string and works with the Bearer header', async () => {
    const res = await request(app)
      .post(TIMER)
      .set('Authorization', bearer(users.Student))
      .send({ title: 'T', duration: 10 });
    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('');
  });

  it('ignores a user, type or status sent by the client', async () => {
    const res = await request(app)
      .post(TIMER)
      .set('Cookie', authCookie(users.Student))
      .send({
        title: 'T',
        duration: 10,
        user: String(users.Admin._id),
        type: 'reminder',
        status: 'completed',
      });
    expect(res.body.data).toMatchObject({
      user: String(users.Student._id),
      type: 'timer',
      status: 'active',
    });
  });

  it.each([
    ['missing title', { duration: 60 }],
    ['blank title', { title: '   ', duration: 60 }],
    ['missing duration', { title: 'T' }],
    ['zero duration', { title: 'T', duration: 0 }],
    ['negative duration', { title: 'T', duration: -5 }],
    ['text duration', { title: 'T', duration: 'abc' }],
    ['title too long', { title: 'x'.repeat(MAX_TITLE + 1), duration: 60 }],
    ['non-text description', { title: 'T', duration: 60, description: { a: 1 } }],
    ['array description', { title: 'T', duration: 60, description: ['x'] }],
  ])('400 for %s and nothing is saved', async (_name, body) => {
    const before = await StudySchedule.countDocuments();
    const res = await request(app).post(TIMER).set('Cookie', authCookie(users.Student)).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(await StudySchedule.countDocuments()).toBe(before);
  });

  it('400 (not 500) when the title is not a string', async () => {
    const res = await request(app)
      .post(TIMER)
      .set('Cookie', authCookie(users.Student))
      .send({ title: 42, duration: 60 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/study-schedules/reminder', () => {
  const start = daysFromNow(1).toISOString();
  const end = daysFromNow(2).toISOString();

  it('401 without a token', async () => {
    const res = await request(app).post(REMINDER).send({ title: 'T', startDateTime: start });
    expect(res.status).toBe(401);
  });

  it.each(ROLES)('%s creates a reminder for themselves', async (role) => {
    const res = await request(app)
      .post(REMINDER)
      .set('Cookie', authCookie(users[role]))
      .send({ title: ' Exam ', description: ' prep ', startDateTime: start, endDateTime: end });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, message: 'Reminder created' });
    expect(res.body.data).toMatchObject({
      user: String(users[role]._id),
      type: 'reminder',
      title: 'Exam',
      description: 'prep',
      status: 'pending',
    });
    expect(new Date(res.body.data.startDateTime).toISOString()).toBe(start);
    expect(new Date(res.body.data.endDateTime).toISOString()).toBe(end);
  });

  it('the end time is optional', async () => {
    const res = await request(app)
      .post(REMINDER)
      .set('Cookie', authCookie(users.Student))
      .send({ title: 'T', startDateTime: start });
    expect(res.status).toBe(201);
    expect(res.body.data.endDateTime).toBeUndefined();
  });

  it.each([
    ['missing title', { startDateTime: start }],
    ['blank title', { title: ' ', startDateTime: start }],
    ['missing start', { title: 'T' }],
    ['invalid start', { title: 'T', startDateTime: 'soon' }],
    ['invalid end', { title: 'T', startDateTime: start, endDateTime: 'later' }],
    ['end equal to start', { title: 'T', startDateTime: start, endDateTime: start }],
    ['end before start', { title: 'T', startDateTime: end, endDateTime: start }],
    ['non-text description', { title: 'T', startDateTime: start, description: 42 }],
  ])('400 for %s and nothing is saved', async (_name, body) => {
    const before = await StudySchedule.countDocuments();
    const res = await request(app)
      .post(REMINDER)
      .set('Cookie', authCookie(users.Student))
      .send(body);
    expect(res.status).toBe(400);
    expect(await StudySchedule.countDocuments()).toBe(before);
  });

  it('400 (not 500) when the title is not a string', async () => {
    const res = await request(app)
      .post(REMINDER)
      .set('Cookie', authCookie(users.Student))
      .send({ title: { $gt: '' }, startDateTime: start });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/study-schedules', () => {
  it('401 without a token', async () => {
    expect((await request(app).get(BASE)).status).toBe(401);
  });

  it('lists only my schedules, newest first, with a total', async () => {
    const me = await createUser('Moderator');
    const older = await createTimerDoc(me, { createdAt: new Date(Date.now() - 60_000) });
    const newer = await createReminderDoc(me);
    await createTimerDoc(users.Student, { title: 'not mine' });
    const res = await request(app).get(BASE).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((s: { _id: string }) => s._id)).toEqual([
      String(newer._id),
      String(older._id),
    ]);
  });

  it('filters by type and status', async () => {
    const me = await createUser('Teacher');
    await createTimerDoc(me, { status: 'active' });
    await createTimerDoc(me, { status: 'completed' });
    await createReminderDoc(me, { status: 'pending' });
    const timers = await request(app).get(`${BASE}?type=timer`).set('Cookie', authCookie(me));
    expect(timers.body.data.every((s: { type: string }) => s.type === 'timer')).toBe(true);
    expect(timers.body.total).toBe(2);
    const done = await request(app)
      .get(`${BASE}?type=timer&status=completed`)
      .set('Cookie', authCookie(me));
    expect(done.body.total).toBe(1);
    expect(done.body.data[0].status).toBe('completed');
    const none = await request(app)
      .get(`${BASE}?type=reminder&status=completed`)
      .set('Cookie', authCookie(me));
    expect(none.body).toMatchObject({ success: true, data: [], total: 0 });
  });

  it('does not run an operator object from the query (it is ignored, still only my data)', async () => {
    const me = await createUser('Admin');
    await createTimerDoc(me);
    await createTimerDoc(users.Student);
    const res = await request(app).get(`${BASE}?type[$ne]=timer`).set('Cookie', authCookie(me));
    expect(res.status).toBe(200);
    expect(res.body.data.every((s: { user: string }) => s.user === String(me._id))).toBe(true);
  });

  it('an unknown type value matches nothing (empty list, not an error)', async () => {
    const res = await request(app)
      .get(`${BASE}?type=alarm`)
      .set('Cookie', authCookie(users.Student));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

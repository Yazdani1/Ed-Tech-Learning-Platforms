import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { StudySchedule } from '../../src/models/StudySchedule.model';
import { authCookie, bearer, createUsersForAllRoles, missingId, ROLES } from '../factories';
import { createReminderDoc, createTimerDoc, daysFromNow } from '../factories/admin-messaging';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/study-schedules';
const STATUSES = ['pending', 'active', 'paused', 'completed', 'cancelled'];

let users: Record<UserRole, IUser>;

beforeAll(async () => {
  users = await createUsersForAllRoles();
});

const put = (id: string, user: IUser, body: object) =>
  request(app).put(`${BASE}/${id}`).set('Cookie', authCookie(user)).send(body);

describe('PUT /api/study-schedules/:id', () => {
  it('401 without a token', async () => {
    const res = await request(app).put(`${BASE}/${missingId()}`).send({ status: 'paused' });
    expect(res.status).toBe(401);
  });

  it.each(ROLES)('%s updates their own timer progress', async (role) => {
    const timer = await createTimerDoc(users[role]);
    const completedAt = new Date().toISOString();
    const res = await put(String(timer._id), users[role], {
      status: 'completed',
      elapsedSeconds: 321,
      completedAt,
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Schedule updated' });
    expect(res.body.data).toMatchObject({ status: 'completed', elapsedSeconds: 321 });
    const saved = await StudySchedule.findById(timer._id);
    expect(saved?.status).toBe('completed');
    expect(saved?.elapsedSeconds).toBe(321);
    expect(saved?.completedAt?.toISOString()).toBe(completedAt);
  });

  it.each(STATUSES)('accepts status %s', async (status) => {
    const timer = await createTimerDoc(users.Student);
    const res = await put(String(timer._id), users.Student, { status });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(status);
  });

  it('works with the Bearer header', async () => {
    const timer = await createTimerDoc(users.Student);
    const res = await request(app)
      .put(`${BASE}/${timer._id}`)
      .set('Authorization', bearer(users.Student))
      .send({ status: 'paused' });
    expect(res.status).toBe(200);
  });

  it('updates a reminder: title, description, dates, firedAt; null end clears the end', async () => {
    const reminder = await createReminderDoc(users.Student, { endDateTime: daysFromNow(3) });
    const start = daysFromNow(5).toISOString();
    const firedAt = new Date().toISOString();
    const res = await put(String(reminder._id), users.Student, {
      title: ' New title ',
      description: ' New text ',
      startDateTime: start,
      endDateTime: null,
      firedAt,
      status: 'completed',
    });
    expect(res.status).toBe(200);
    const saved = await StudySchedule.findById(reminder._id);
    expect(saved).toMatchObject({
      title: 'New title',
      description: 'New text',
      status: 'completed',
    });
    expect(saved?.startDateTime?.toISOString()).toBe(start);
    expect(saved?.firedAt?.toISOString()).toBe(firedAt);
    expect(saved?.endDateTime).toBeUndefined();
  });

  it('sets a new end date', async () => {
    const reminder = await createReminderDoc(users.Student);
    const end = daysFromNow(9).toISOString();
    const res = await put(String(reminder._id), users.Student, { endDateTime: end });
    expect(res.status).toBe(200);
    expect((await StudySchedule.findById(reminder._id))?.endDateTime?.toISOString()).toBe(end);
  });

  it('403 for another user (even staff) and the schedule is unchanged', async () => {
    const timer = await createTimerDoc(users.Student, { title: 'mine' });
    for (const role of ROLES.filter((r) => r !== 'Student')) {
      const res = await put(String(timer._id), users[role], {
        title: 'hacked',
        status: 'cancelled',
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    }
    const saved = await StudySchedule.findById(timer._id);
    expect(saved).toMatchObject({ title: 'mine', status: 'active' });
  });

  it('404 for a missing id and 400 for a malformed id', async () => {
    expect((await put(missingId(), users.Student, { status: 'paused' })).status).toBe(404);
    expect((await put('nope', users.Student, { status: 'paused' })).status).toBe(400);
  });

  it('400 for an unknown status and nothing changes', async () => {
    const timer = await createTimerDoc(users.Student);
    const res = await put(String(timer._id), users.Student, { status: 'exploded', title: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid status');
    expect((await StudySchedule.findById(timer._id))?.title).not.toBe('x');
  });

  it('400 when the status is an operator object', async () => {
    const timer = await createTimerDoc(users.Student);
    const res = await put(String(timer._id), users.Student, { status: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  it.each([
    ['blank title', { title: '  ' }],
    ['invalid start date', { startDateTime: 'nonsense' }],
    ['invalid end date', { endDateTime: 'nonsense' }],
    ['negative elapsedSeconds', { elapsedSeconds: -10 }],
    ['non-numeric elapsedSeconds', { elapsedSeconds: '12' }],
  ])('400 for %s', async (_name, body) => {
    const reminder = await createReminderDoc(users.Student);
    const res = await put(String(reminder._id), users.Student, body);
    expect(res.status).toBe(400);
  });

  it('400 when the start is moved after the existing end, and nothing changes', async () => {
    const reminder = await createReminderDoc(users.Student, {
      startDateTime: daysFromNow(1),
      endDateTime: daysFromNow(2),
    });
    const res = await put(String(reminder._id), users.Student, {
      startDateTime: daysFromNow(3).toISOString(),
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('End time must be after start time');
    const saved = await StudySchedule.findById(reminder._id);
    expect(saved?.startDateTime?.toISOString()).toBe(reminder.startDateTime?.toISOString());
  });

  it('400 when the end is not after the start (same rule as creating)', async () => {
    const reminder = await createReminderDoc(users.Student, { startDateTime: daysFromNow(2) });
    const res = await put(String(reminder._id), users.Student, {
      endDateTime: daysFromNow(1).toISOString(),
    });
    expect(res.status).toBe(400);
  });

  it('400 (not 500) when the title is not a string', async () => {
    const timer = await createTimerDoc(users.Student);
    const res = await put(String(timer._id), users.Student, { title: 7 });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/study-schedules/:id', () => {
  const del = (id: string, user: IUser) =>
    request(app).delete(`${BASE}/${id}`).set('Cookie', authCookie(user));

  it('401 without a token', async () => {
    expect((await request(app).delete(`${BASE}/${missingId()}`)).status).toBe(401);
  });

  it.each(ROLES)('%s deletes their own schedule', async (role) => {
    const timer = await createTimerDoc(users[role]);
    const res = await del(String(timer._id), users[role]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Schedule deleted' });
    expect(await StudySchedule.exists({ _id: timer._id })).toBeNull();
  });

  it('403 for another user and the schedule stays', async () => {
    const reminder = await createReminderDoc(users.Student);
    for (const role of ROLES.filter((r) => r !== 'Student')) {
      expect((await del(String(reminder._id), users[role])).status).toBe(403);
    }
    expect(await StudySchedule.exists({ _id: reminder._id })).toBeTruthy();
  });

  it('404 for a missing id and 400 for a malformed id; a deleted one is gone for good', async () => {
    expect((await del(missingId(), users.Student)).status).toBe(404);
    expect((await del('nope', users.Student)).status).toBe(400);
    const timer = await createTimerDoc(users.Student);
    await del(String(timer._id), users.Student);
    expect((await del(String(timer._id), users.Student)).status).toBe(404);
  });
});

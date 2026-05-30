import request from 'supertest';
import app from '../../../src/app';
import { StudySchedule } from '../../../src/models/StudySchedule.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Study Schedule API', () => {
  it('creates timers and lists only the authenticated user schedules with filters', async () => {
    const user = await createTestUser({ email: 'student@example.com' });
    const other = await createTestUser({ email: 'other@example.com' });
    await StudySchedule.create({
      user: other._id,
      type: 'timer',
      title: 'Other user timer',
      description: '',
      duration: 60,
      status: 'active',
    });

    const create = await request(app).post('/api/study-schedules/timer').set(authHeaderFor(user)).send({
      title: 'Focus Sprint',
      duration: 1500,
      description: 'Pomodoro',
    });
    expectSuccess(create, 201);
    expect(create.body.data).toMatchObject({ type: 'timer', title: 'Focus Sprint', status: 'active' });

    const list = await request(app).get('/api/study-schedules?type=timer&status=active').set(authHeaderFor(user));
    expectSuccess(list);
    expect(list.body.total).toBe(1);
    expect(list.body.data[0].title).toBe('Focus Sprint');
  });

  it('validates timer title and duration boundaries', async () => {
    const user = await createTestUser({ email: 'student@example.com' });

    const missingTitle = await request(app).post('/api/study-schedules/timer').set(authHeaderFor(user)).send({ duration: 1500 });
    expectError(missingTitle, 400, /Title is required/);

    const zeroDuration = await request(app).post('/api/study-schedules/timer').set(authHeaderFor(user)).send({ title: 'Bad', duration: 0 });
    expectError(zeroDuration, 400, /Duration must be greater than 0/);

    const negativeDuration = await request(app).post('/api/study-schedules/timer').set(authHeaderFor(user)).send({ title: 'Bad', duration: -1 });
    expectError(negativeDuration, 400, /Duration must be greater than 0/);
  });

  it('creates reminders with valid dates and rejects missing, invalid, or reversed dates', async () => {
    const user = await createTestUser({ email: 'student@example.com' });
    const start = new Date('2030-01-01T10:00:00.000Z');
    const end = new Date('2030-01-01T11:00:00.000Z');

    const create = await request(app).post('/api/study-schedules/reminder').set(authHeaderFor(user)).send({
      title: 'Live class',
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    });
    expectSuccess(create, 201);
    expect(create.body.data).toMatchObject({ type: 'reminder', status: 'pending' });

    const missingStart = await request(app).post('/api/study-schedules/reminder').set(authHeaderFor(user)).send({ title: 'No start' });
    expectError(missingStart, 400, /Start date\/time is required/);

    const invalidStart = await request(app).post('/api/study-schedules/reminder').set(authHeaderFor(user)).send({
      title: 'Bad start',
      startDateTime: 'not-a-date',
    });
    expectError(invalidStart, 400, /Invalid start date\/time/);

    const reversed = await request(app).post('/api/study-schedules/reminder').set(authHeaderFor(user)).send({
      title: 'Bad end',
      startDateTime: end.toISOString(),
      endDateTime: start.toISOString(),
    });
    expectError(reversed, 400, /End time must be after start time/);
  });

  it('updates and deletes owned schedules while blocking cross-user mutation', async () => {
    const owner = await createTestUser({ email: 'owner@example.com' });
    const stranger = await createTestUser({ email: 'stranger@example.com' });
    const schedule = await StudySchedule.create({
      user: owner._id,
      type: 'timer',
      title: 'Original',
      description: '',
      duration: 600,
      elapsedSeconds: 0,
      status: 'active',
    });

    const update = await request(app).put(`/api/study-schedules/${schedule._id}`).set(authHeaderFor(owner)).send({
      title: 'Updated',
      status: 'paused',
      elapsedSeconds: 120,
    });
    expectSuccess(update);
    expect(update.body.data).toMatchObject({ title: 'Updated', status: 'paused', elapsedSeconds: 120 });

    const invalidStatus = await request(app).put(`/api/study-schedules/${schedule._id}`).set(authHeaderFor(owner)).send({ status: 'sleeping' });
    expectError(invalidStatus, 400, /Invalid status/);

    const blockedUpdate = await request(app).put(`/api/study-schedules/${schedule._id}`).set(authHeaderFor(stranger)).send({ title: 'Nope' });
    expectError(blockedUpdate, 403, /Not authorized/);

    const blocked = await request(app).delete(`/api/study-schedules/${schedule._id}`).set(authHeaderFor(stranger));
    expectError(blocked, 403, /Not authorized/);

    const remove = await request(app).delete(`/api/study-schedules/${schedule._id}`).set(authHeaderFor(owner));
    expectSuccess(remove);
  });

  it('handles invalid and missing schedule IDs', async () => {
    const user = await createTestUser({ email: 'student@example.com' });

    const invalid = await request(app).put('/api/study-schedules/not-an-id').set(authHeaderFor(user)).send({ title: 'Updated' });
    expectError(invalid, 400, /Invalid _id/);

    const missing = await request(app).delete(`/api/study-schedules/${makeObjectId()}`).set(authHeaderFor(user));
    expectError(missing, 404, /Schedule not found/);
  });
});

import request from 'supertest';
import app from '../../../src/app';
import { Notification } from '../../../src/models/Notification.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Notifications API', () => {
  it('creates, reads, marks, updates, lists sent, and deletes notifications', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });

    const create = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({
      title: 'System notice',
      message: 'Hello students',
      priority: 'High',
      targetRoles: ['Student'],
    });
    expectSuccess(create, 201);
    expect(create.body.data.recipients).toHaveLength(1);

    const mine = await request(app).get('/api/notifications?page=1&limit=5').set(authHeaderFor(student));
    expectSuccess(mine);
    expect(mine.body.total).toBe(1);
    expect(mine.body.data[0].isRead).toBe(false);

    const count = await request(app).get('/api/notifications/unread-count').set(authHeaderFor(student));
    expectSuccess(count);
    expect(count.body.data.count).toBe(1);

    const read = await request(app).patch(`/api/notifications/${create.body.data._id}/read`).set(authHeaderFor(student));
    expectSuccess(read);
    expect(read.body.data.isRead).toBe(true);

    const allRead = await request(app).patch('/api/notifications/read-all').set(authHeaderFor(student));
    expectSuccess(allRead);

    const sent = await request(app).get('/api/notifications/sent/all').set(authHeaderFor(admin));
    expectSuccess(sent);
    expect(sent.body.total).toBe(1);

    const update = await request(app).put(`/api/notifications/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Updated notice',
      message: 'Updated message',
      priority: 'Urgent',
      targetRoles: ['Student'],
    });
    expectSuccess(update);
    expect(update.body.data.title).toBe('Updated notice');

    const remove = await request(app).delete(`/api/notifications/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(await Notification.findById(create.body.data._id)).toBeNull();
  });

  it('validates notification payloads, ids, targets, and missing records', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });

    const missingTitle = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ message: 'M', targetRoles: ['Student'] });
    expectError(missingTitle, 400, /title is required/);

    const badPriority = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ title: 'T', message: 'M', priority: 'Extreme', targetRoles: ['Student'] });
    expectError(badPriority, 400, /Invalid notification priority/);

    const noRoles = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ title: 'T', message: 'M', targetRoles: ['Owner'] });
    expectError(noRoles, 400, /Select at least one/);

    const noUsers = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ title: 'T', message: 'M', targetRoles: ['Teacher'] });
    expectError(noUsers, 400, /No users found/);

    const invalidRead = await request(app).patch('/api/notifications/not-an-id/read').set(authHeaderFor(student));
    expectError(invalidRead, 400, /Invalid notification id/);

    const missingRead = await request(app).patch(`/api/notifications/${makeObjectId()}/read`).set(authHeaderFor(student));
    expectError(missingRead, 404, /Notification not found/);

    const invalidUpdate = await request(app).put('/api/notifications/not-an-id').set(authHeaderFor(admin)).send({ title: 'X' });
    expectError(invalidUpdate, 400, /Invalid notification id/);

    const missingDelete = await request(app).delete(`/api/notifications/${makeObjectId()}`).set(authHeaderFor(admin));
    expectError(missingDelete, 404, /Notification not found/);
  });
});

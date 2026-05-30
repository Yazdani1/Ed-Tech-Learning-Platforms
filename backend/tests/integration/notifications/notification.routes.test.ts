import request from 'supertest';
import app from '../../../src/app';
import { Notification } from '../../../src/models/Notification.model';
import * as socketModule from '../../../src/socket/index';
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

    const missingMessage = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ title: 'T', targetRoles: ['Student'] });
    expectError(missingMessage, 400, /message is required/);

    const nonArrayRoles = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({ title: 'T', message: 'M', targetRoles: 'Student' });
    expectError(nonArrayRoles, 400, /Select at least one/);

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

  it('emits socket events when notifications are created, updated, and deleted', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    jest.spyOn(socketModule, 'getSocketIO').mockReturnValue({ to } as never);

    const create = await request(app).post('/api/notifications').set(authHeaderFor(admin)).send({
      title: 'Socket notice',
      message: 'Realtime message',
      priority: 'Normal',
      targetRoles: ['Student'],
    });
    expectSuccess(create, 201);
    expect(to).toHaveBeenCalledWith(`user:${student._id.toString()}`);
    expect(emit).toHaveBeenCalledWith('notification:new', expect.objectContaining({
      notification: expect.objectContaining({ isRead: false, readAt: null }),
    }));

    const read = await request(app).patch(`/api/notifications/${create.body.data._id}/read`).set(authHeaderFor(student));
    expectSuccess(read);

    const update = await request(app).put(`/api/notifications/${create.body.data._id}`).set(authHeaderFor(admin)).send({
      title: 'Socket notice updated',
      targetRoles: ['Student', 'Owner'],
    });
    expectSuccess(update);
    expect(emit).toHaveBeenCalledWith('notification:updated', expect.objectContaining({
      notification: expect.objectContaining({ title: 'Socket notice updated', isRead: true }),
    }));

    const remove = await request(app).delete(`/api/notifications/${create.body.data._id}`).set(authHeaderFor(admin));
    expectSuccess(remove);
    expect(emit).toHaveBeenCalledWith('notification:deleted', { notificationId: create.body.data._id });

    jest.restoreAllMocks();
  });

  it('validates notification update fields and missing update targets', async () => {
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    await createTestUser({ role: 'Student', email: 'student@example.com' });
    const notification = await Notification.create({
      title: 'Existing',
      message: 'Message',
      priority: 'Normal',
      targetRoles: ['Student'],
      sentBy: admin._id,
      recipients: [],
    });

    const emptyTitle = await request(app).put(`/api/notifications/${notification._id}`).set(authHeaderFor(admin)).send({ title: '   ' });
    expectError(emptyTitle, 400, /title is required/);

    const emptyMessage = await request(app).put(`/api/notifications/${notification._id}`).set(authHeaderFor(admin)).send({ message: '   ' });
    expectError(emptyMessage, 400, /message is required/);

    const badPriority = await request(app).put(`/api/notifications/${notification._id}`).set(authHeaderFor(admin)).send({ priority: 'Extreme' });
    expectError(badPriority, 400, /Invalid notification priority/);

    const badRoles = await request(app).put(`/api/notifications/${notification._id}`).set(authHeaderFor(admin)).send({ targetRoles: ['Owner'] });
    expectError(badRoles, 400, /Select at least one/);

    const missingUpdateWithRoles = await request(app).put(`/api/notifications/${makeObjectId()}`).set(authHeaderFor(admin)).send({ targetRoles: ['Student'] });
    expectError(missingUpdateWithRoles, 404, /Notification not found/);

    const missingUpdate = await request(app).put(`/api/notifications/${makeObjectId()}`).set(authHeaderFor(admin)).send({ title: 'No record' });
    expectError(missingUpdate, 404, /Notification not found/);

    const invalidDelete = await request(app).delete('/api/notifications/not-an-id').set(authHeaderFor(admin));
    expectError(invalidDelete, 400, /Invalid notification id/);
  });
});

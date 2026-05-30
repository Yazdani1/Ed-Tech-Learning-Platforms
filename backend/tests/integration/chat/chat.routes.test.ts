import request from 'supertest';
import app from '../../../src/app';
import { ChatConversation } from '../../../src/models/ChatConversation.model';
import { ChatMessage } from '../../../src/models/ChatMessage.model';
import { authHeaderFor, createTestUser } from '../../helpers/auth.helper';
import { expectError, expectSuccess } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

describe('Chat API', () => {
  it('creates or returns a student conversation and lets staff list all conversations', async () => {
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });

    const mine = await request(app).get('/api/chat/conversations').set(authHeaderFor(student));
    expectSuccess(mine);
    expect(mine.body.data.student._id).toBe(String(student._id));

    const staff = await request(app).get('/api/chat/conversations').set(authHeaderFor(admin));
    expectSuccess(staff);
    expect(staff.body.data).toHaveLength(1);
  });

  it('returns messages for authorized users and blocks other students', async () => {
    const student = await createTestUser({ role: 'Student', email: 'student@example.com' });
    const other = await createTestUser({ role: 'Student', email: 'other@example.com' });
    const admin = await createTestUser({ role: 'Admin', email: 'admin@example.com' });
    const conversation = await ChatConversation.create({ student: student._id });
    await ChatMessage.create({
      conversationId: conversation._id,
      senderId: student._id,
      senderName: student.name,
      senderRole: student.role,
      content: 'Hello',
    });

    const own = await request(app).get(`/api/chat/conversations/${conversation._id}/messages`).set(authHeaderFor(student));
    expectSuccess(own);
    expect(own.body.data).toHaveLength(1);

    const staff = await request(app).get(`/api/chat/conversations/${conversation._id}/messages`).set(authHeaderFor(admin));
    expectSuccess(staff);

    const blocked = await request(app).get(`/api/chat/conversations/${conversation._id}/messages`).set(authHeaderFor(other));
    expectError(blocked, 403, /Not authorized/);

    const missing = await request(app).get(`/api/chat/conversations/${makeObjectId()}/messages`).set(authHeaderFor(admin));
    expectError(missing, 404, /Conversation not found/);
  });
});

import request from 'supertest';
import app from '../../../src/app';
import { createTestUser, authHeaderFor } from '../../helpers/auth.helper';
import { expectError } from '../../helpers/assertions.helper';
import { makeObjectId } from '../../helpers/data.helper';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

const call = (method: Method, path: string) => request(app)[method](path);

const protectedRoutes: Array<[Method, string]> = [
  ['get', `/api/users`],
  ['post', `/api/users`],
  ['get', `/api/users/${makeObjectId()}`],
  ['put', `/api/users/${makeObjectId()}`],
  ['put', `/api/users/${makeObjectId()}/role`],
  ['delete', `/api/users/${makeObjectId()}`],
  ['post', `/api/categories`],
  ['put', `/api/categories/${makeObjectId()}`],
  ['delete', `/api/categories/${makeObjectId()}`],
  ['post', `/api/course-types`],
  ['put', `/api/course-types/${makeObjectId()}`],
  ['delete', `/api/course-types/${makeObjectId()}`],
  ['post', `/api/courses`],
  ['put', `/api/courses/${makeObjectId()}`],
  ['patch', `/api/courses/${makeObjectId()}/status`],
  ['delete', `/api/courses/${makeObjectId()}`],
  ['patch', `/api/courses/bulk`],
  ['patch', `/api/courses/bulk/discount`],
  ['get', `/api/dashboard/summary`],
  ['get', `/api/performance/overview`],
  ['get', `/api/enrollments`],
  ['post', `/api/enrollments/${makeObjectId()}`],
  ['delete', `/api/enrollments/${makeObjectId()}`],
  ['get', `/api/subscriptions/my`],
  ['post', `/api/subscriptions/subscribe`],
  ['get', `/api/notifications`],
  ['get', `/api/chat/conversations`],
  ['get', `/api/group-chat/channels`],
  ['get', `/api/study-schedules`],
  ['post', `/api/study-schedules/timer`],
  ['post', `/api/study-schedules/reminder`],
  ['post', `/api/quiz-bank`],
  ['post', `/api/quiz-sections`],
  ['post', `/api/study-curricula/course/${makeObjectId()}`],
  ['post', `/api/study-materials/course/${makeObjectId()}`],
  ['post', `/api/announcements/course/${makeObjectId()}`],
  ['get', `/api/qa/questions/course/${makeObjectId()}`],
];

const adminOnlyRoutes: Array<[Method, string]> = [
  ['post', '/api/users'],
  ['get', '/api/users'],
  ['post', '/api/categories'],
  ['post', '/api/course-types'],
  ['post', '/api/courses'],
  ['patch', '/api/courses/bulk'],
  ['patch', '/api/courses/bulk/discount'],
  ['get', '/api/dashboard/summary'],
  ['get', '/api/performance/overview'],
  ['post', '/api/subscription-plans'],
  ['get', '/api/subscriptions'],
  ['post', '/api/subscriptions/assign'],
  ['post', '/api/notifications'],
  ['get', '/api/community/settings'],
];

describe('Protected API route contract', () => {
  it.each(protectedRoutes)('%s %s rejects anonymous requests before controller execution', async (method, path) => {
    const res = await call(method, path).send({});

    expectError(res, 401, /Not authorized/);
  });

  it.each(adminOnlyRoutes)('%s %s rejects authenticated students from privileged routes', async (method, path) => {
    const student = await createTestUser({ role: 'Student', email: `${method}-${path.replace(/[^a-z]/gi, '')}@example.com` });

    const res = await call(method, path).set(authHeaderFor(student)).send({});

    expectError(res, 403, /not authorized for this action/);
  });
});

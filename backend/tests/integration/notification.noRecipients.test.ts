import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { Notification } from '../../src/models/Notification.model';
import { authCookie, createUser } from '../factories';

import type { IUser } from '../../src/models/User.model';

let admin: IUser;

beforeAll(async () => {
  admin = await createUser('Admin');
});

describe('POST /api/notifications: no users for the chosen roles', () => {
  it('400 and nothing is saved when no user has the selected role', async () => {
    const res = await request(app)
      .post('/api/notifications')
      .set('Cookie', authCookie(admin))
      .send({ title: 'T', message: 'M', targetRoles: ['Student'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No users found for the selected roles');
    expect(await Notification.countDocuments()).toBe(0);
  });
});

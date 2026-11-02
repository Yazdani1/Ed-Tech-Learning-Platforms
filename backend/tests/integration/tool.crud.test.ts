import request from 'supertest';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app';
import { Course } from '../../src/models/Course.model';
import { Tool } from '../../src/models/Tool.model';
import {
  authCookie,
  bearer,
  createCourse,
  createUsersForAllRoles,
  missingId,
  PNG_BYTES,
} from '../factories';
import { mockCloudinary, type CloudinaryMock } from '../helpers/cloudinary';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/tools';
const ALLOWED: UserRole[] = ['Super Admin', 'Admin'];
const DENIED: UserRole[] = ['Moderator', 'Teacher', 'Student'];
const png = { filename: 'logo.png', contentType: 'image/png' };
let users: Record<UserRole, IUser>;
let cloud: CloudinaryMock;
const as = (role: UserRole) => authCookie(users[role]);

beforeAll(async () => {
  users = await createUsersForAllRoles();
});
beforeEach(async () => {
  cloud = mockCloudinary();
  await Tool.deleteMany({});
});
afterEach(() => {
  vi.restoreAllMocks();
});

const makeTool = async (name: string) => {
  const res = await request(app)
    .post(BASE)
    .set('Cookie', as('Admin'))
    .field('name', name)
    .attach('logo', PNG_BYTES, png);
  expect(res.status).toBe(201);
  return res.body.data as { _id: string; name: string; logoUrl: string };
};

describe('GET /api/tools', () => {
  it('is public, sorted by name and never exposes the Cloudinary id', async () => {
    await makeTool('Zed');
    await makeTool('Alpha');
    const res = await request(app).get(BASE);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data.map((t: { name: string }) => t.name)).toEqual(['Alpha', 'Zed']);
    expect(res.body.data[0].logoUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(JSON.stringify(res.body)).not.toContain('logoPublicId');
  });

  it('is empty when there are no tools', async () => {
    const res = await request(app).get(BASE);
    expect(res.body).toEqual({ success: true, data: [], total: 0 });
  });
});

describe('POST /api/tools', () => {
  it('401 without a token', async () => {
    const res = await request(app).post(BASE).field('name', 'X').attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as(role))
      .field('name', 'X')
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(403);
    expect(await Tool.countDocuments()).toBe(0);
  });

  it.each(ALLOWED)('%s creates a tool (trimmed name, logo in medhabee/tools)', async (role) => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as(role))
      .field('name', '  React  ')
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: 'React' });
    expect(res.body.data.logoPublicId).toBeUndefined();
    expect(cloud.upload.mock.calls[0][0]).toMatchObject({ folder: 'medhabee/tools' });
    const saved = await Tool.findById(res.body.data._id).select('+logoPublicId');
    expect(saved?.logoPublicId).toMatch(/^medhabee\/tools\//);
  });

  it('accepts the Bearer header', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', bearer(users.Admin))
      .field('name', 'Bearer tool')
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(201);
  });

  it('accepts a 60 character name', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', 'n'.repeat(60))
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(201);
  });

  it('400 when the name is missing or blank', async () => {
    const missing = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .attach('logo', PNG_BYTES, png);
    expect(missing.status).toBe(400);
    const blank = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', '   ')
      .attach('logo', PNG_BYTES, png);
    expect(blank.status).toBe(400);
  });

  it('400 when the name is over 60 characters', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', 'n'.repeat(61))
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(400);
  });

  it('400 when the logo is missing, and nothing is uploaded', async () => {
    const res = await request(app).post(BASE).set('Cookie', as('Admin')).field('name', 'NoLogo');
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Tool logo is required');
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 for a duplicate name, ignoring case, and does not upload', async () => {
    await makeTool('Node.js');
    cloud.upload.mockClear();
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', 'node.JS')
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('A tool with this name already exists');
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(await Tool.countDocuments()).toBe(1);
  });

  it('treats regex characters in the name literally', async () => {
    await makeTool('C++');
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', 'C.*')
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(201);
  });

  it('400 for a non-image logo', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Cookie', as('Admin'))
      .field('name', 'Bad')
      .attach('logo', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/tools/:id', () => {
  it('401 without a token', async () => {
    const tool = await makeTool('T');
    expect((await request(app).put(`${BASE}/${tool._id}`).field('name', 'U')).status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const tool = await makeTool('T');
    const res = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as(role))
      .field('name', 'U');
    expect(res.status).toBe(403);
  });

  it('renames only', async () => {
    const tool = await makeTool('Old');
    cloud.upload.mockClear();
    const res = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Admin'))
      .field('name', 'New');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'New', logoUrl: tool.logoUrl });
    expect(cloud.upload).not.toHaveBeenCalled();
    expect(cloud.destroy).not.toHaveBeenCalled();
  });

  it('replaces the logo and deletes the old one from Cloudinary', async () => {
    const tool = await makeTool('Logo');
    const before = await Tool.findById(tool._id).select('+logoPublicId');
    const res = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Super Admin'))
      .attach('logo', PNG_BYTES, png);
    expect(res.status).toBe(200);
    expect(res.body.data.logoUrl).not.toBe(tool.logoUrl);
    expect(res.body.data.name).toBe('Logo');
    expect(cloud.destroy).toHaveBeenCalledWith(before?.logoPublicId);
  });

  it('allows saving the same name for the same tool', async () => {
    const tool = await makeTool('Same');
    const res = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Admin'))
      .field('name', 'SAME');
    expect(res.status).toBe(200);
  });

  it('400 for a name taken by another tool, blank or too long', async () => {
    await makeTool('Taken');
    const tool = await makeTool('Mine');
    const taken = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Admin'))
      .field('name', 'taken');
    expect(taken.status).toBe(400);
    const blank = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Admin'))
      .field('name', ' ');
    expect(blank.status).toBe(400);
    const long = await request(app)
      .put(`${BASE}/${tool._id}`)
      .set('Cookie', as('Admin'))
      .field('name', 'n'.repeat(61));
    expect(long.status).toBe(400);
    expect((await Tool.findById(tool._id))?.name).toBe('Mine');
  });

  it('404 for an unknown or malformed id', async () => {
    const unknown = await request(app)
      .put(`${BASE}/${missingId()}`)
      .set('Cookie', as('Admin'))
      .field('name', 'X');
    expect(unknown.status).toBe(404);
    const bad = await request(app)
      .put(`${BASE}/nope`)
      .set('Cookie', as('Admin'))
      .field('name', 'X');
    expect(bad.status).toBe(404);
  });
});

describe('DELETE /api/tools/:id', () => {
  it('401 without a token', async () => {
    const tool = await makeTool('T');
    expect((await request(app).delete(`${BASE}/${tool._id}`)).status).toBe(401);
  });

  it.each(DENIED)('403 for %s and keeps the tool', async (role) => {
    const tool = await makeTool('T');
    expect((await request(app).delete(`${BASE}/${tool._id}`).set('Cookie', as(role))).status).toBe(
      403,
    );
    expect(await Tool.countDocuments()).toBe(1);
  });

  it.each(ALLOWED)('%s deletes the tool, its logo and removes it from courses', async (role) => {
    const keep = await makeTool(`Keep ${role}`);
    const tool = await makeTool(`Gone ${role}`);
    const course = await createCourse({ toolsSection: { tools: [tool._id, keep._id] } } as never);
    const before = await Tool.findById(tool._id).select('+logoPublicId');

    const res = await request(app).delete(`${BASE}/${tool._id}`).set('Cookie', as(role));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Tool deleted' });
    expect(await Tool.findById(tool._id)).toBeNull();
    expect(cloud.destroy).toHaveBeenCalledWith(before?.logoPublicId);
    const saved = await Course.findById(course._id).lean();
    expect(saved?.toolsSection?.tools.map(String)).toEqual([keep._id]);
  });

  it('404 for an unknown or malformed id', async () => {
    expect(
      (await request(app).delete(`${BASE}/${missingId()}`).set('Cookie', as('Admin'))).status,
    ).toBe(404);
    expect((await request(app).delete(`${BASE}/nope`).set('Cookie', as('Admin'))).status).toBe(404);
  });
});

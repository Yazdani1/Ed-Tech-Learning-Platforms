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

const ALLOWED: UserRole[] = ['Super Admin', 'Admin'];
const DENIED: UserRole[] = ['Moderator', 'Teacher', 'Student'];
const png = { filename: 'pic.png', contentType: 'image/png' };
let users: Record<UserRole, IUser>;
let cloud: CloudinaryMock;
const as = (role: UserRole) => authCookie(users[role]);

beforeAll(async () => {
  users = await createUsersForAllRoles();
});
beforeEach(() => {
  cloud = mockCloudinary();
});
afterEach(() => {
  vi.restoreAllMocks();
});

// Picture ids are unique per test: a course may not reuse another course's picture, and the database keeps
// the courses of earlier tests
let testRun = 0;
beforeEach(() => {
  testRun += 1;
});
const img = (name: string) => ({
  url: `https://res.cloudinary.com/test-cloud/medhabee/course-extras/${name}-${testRun}`,
  publicId: `medhabee/course-extras/${name}-${testRun}`,
});
const patch = (id: unknown, body: unknown, role: UserRole = 'Admin') =>
  request(app)
    .patch(`/api/courses/${id}/extras`)
    .set('Cookie', as(role))
    .send(body as object);
const makeTool = (name: string) =>
  Tool.create({
    name,
    logoUrl: `https://res.cloudinary.com/test-cloud/${name}.png`,
    logoPublicId: `medhabee/tools/${name}`,
    createdBy: users.Admin._id,
  });

describe('POST /api/courses/:id/images', () => {
  it('401 for guests', async () => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(401);
  });

  it.each(DENIED)('403 for %s', async (role) => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .set('Cookie', as(role))
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(403);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it.each(ALLOWED)('%s uploads into medhabee/course-extras', async (role) => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .set('Cookie', as(role))
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(201);
    expect(res.body.data.publicId).toMatch(/^medhabee\/course-extras\//);
    expect(res.body.data.url).toContain(res.body.data.publicId);
    expect(cloud.upload.mock.calls[0][0]).toMatchObject({ folder: 'medhabee/course-extras' });
  });

  it('accepts the Bearer header', async () => {
    const course = await createCourse();
    const res = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .set('Authorization', bearer(users.Admin))
      .attach('image', PNG_BYTES, png);
    expect(res.status).toBe(201);
  });

  it('404 for an unknown or malformed course, without uploading', async () => {
    const unknown = await request(app)
      .post(`/api/courses/${missingId()}/images`)
      .set('Cookie', as('Admin'))
      .attach('image', PNG_BYTES, png);
    expect(unknown.status).toBe(404);
    const bad = await request(app)
      .post('/api/courses/nope/images')
      .set('Cookie', as('Admin'))
      .attach('image', PNG_BYTES, png);
    expect(bad.status).toBe(404);
    expect(cloud.upload).not.toHaveBeenCalled();
  });

  it('400 when the image is missing or not an image', async () => {
    const course = await createCourse();
    const none = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .set('Cookie', as('Admin'));
    expect(none.status).toBe(400);
    const text = await request(app)
      .post(`/api/courses/${course._id}/images`)
      .set('Cookie', as('Admin'))
      .attach('image', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' });
    expect(text.status).toBe(400);
  });
});

describe('PATCH /api/courses/:id/extras access', () => {
  it('401 for guests', async () => {
    const course = await createCourse();
    expect(
      (
        await request(app)
          .patch(`/api/courses/${course._id}/extras`)
          .send({ audience: ['a'] })
      ).status,
    ).toBe(401);
  });

  it.each(DENIED)('403 for %s and nothing changes', async (role) => {
    const course = await createCourse();
    const res = await patch(course._id, { audience: ['a'] }, role);
    expect(res.status).toBe(403);
    expect((await Course.findById(course._id))?.audience).toEqual([]);
  });

  it('accepts the Bearer header', async () => {
    const course = await createCourse();
    const res = await request(app)
      .patch(`/api/courses/${course._id}/extras`)
      .set('Authorization', bearer(users['Super Admin']))
      .send({ audience: ['a'] });
    expect(res.status).toBe(200);
  });

  it('404 for an unknown or malformed course', async () => {
    expect((await patch(missingId(), { audience: ['a'] })).status).toBe(404);
    expect((await patch('nope', { audience: ['a'] })).status).toBe(404);
  });
});

describe('PATCH /api/courses/:id/extras success', () => {
  it.each(ALLOWED)('%s saves every section and gets the tools populated', async (role) => {
    const course = await createCourse();
    const tool = await makeTool(`Tool ${role}`);
    const res = await patch(
      course._id,
      {
        toolsSection: {
          title: ' Tools ',
          description: 'We use',
          tools: [String(tool._id), String(tool._id)],
        },
        benefitsSection: {
          title: 'You get',
          items: [{ title: 'Certificate', description: 'PDF', icon: img('icon1') }],
        },
        projects: [
          {
            title: 'Shop',
            description: 'A shop',
            images: [img('p1'), img('p2')],
            liveDemoUrl: 'https://demo.example.com/a',
            videoUrl: 'http://video.example.com',
          },
        ],
        audience: ['Beginners', ' Designers '],
        successStories: [
          {
            title: 'Got a job',
            companyName: 'Acme',
            photo: img('photo'),
            companyLogo: img('logo'),
          },
        ],
        faqs: [{ question: 'Free?', answer: 'Yes' }],
      },
      role,
    );

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.toolsSection.title).toBe('Tools');
    expect(data.toolsSection.tools).toEqual([
      { _id: String(tool._id), name: `Tool ${role}`, logoUrl: tool.logoUrl },
    ]);
    expect(data.benefitsSection.items[0]).toMatchObject({
      title: 'Certificate',
      icon: img('icon1'),
    });
    expect(data.projects[0].images).toHaveLength(2);
    expect(data.projects[0].liveDemoUrl).toBe('https://demo.example.com/a');
    expect(data.audience).toEqual(['Beginners', 'Designers']);
    expect(data.successStories[0]).toMatchObject({ companyName: 'Acme', photo: img('photo') });
    expect(data.faqs).toMatchObject([{ question: 'Free?', answer: 'Yes' }]);
    expect(cloud.destroy).not.toHaveBeenCalled();
  });

  it('changes only the sent sections', async () => {
    const course = await createCourse();
    await patch(course._id, { audience: ['One'] });
    const res = await patch(course._id, { faqs: [{ question: 'Q', answer: 'A' }] });
    expect(res.body.data.audience).toEqual(['One']);
    expect(res.body.data.faqs).toHaveLength(1);
  });

  it('GET /api/courses/:id returns the sections with tools populated', async () => {
    const course = await createCourse();
    const tool = await makeTool('Visible');
    await patch(course._id, {
      toolsSection: { tools: [String(tool._id)] },
      audience: ['Everyone'],
      faqs: [{ question: 'Q', answer: 'A' }],
    });
    const res = await request(app).get(`/api/courses/${course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.toolsSection.tools[0]).toMatchObject({
      name: 'Visible',
      logoUrl: tool.logoUrl,
    });
    expect(res.body.data.audience).toEqual(['Everyone']);
    expect(res.body.data.faqs).toHaveLength(1);
  });

  it('deletes pictures that a save removed from Cloudinary, and keeps the ones still used', async () => {
    const course = await createCourse();
    await patch(course._id, {
      projects: [{ title: 'P', images: [img('keep'), img('drop')] }],
      successStories: [{ title: 'S', photo: img('photo') }],
    });
    cloud.destroy.mockClear();

    await patch(course._id, {
      projects: [{ title: 'P', images: [img('keep')] }],
      successStories: [],
    });

    const destroyed = cloud.destroy.mock.calls.map((call) => call[0]).sort();
    expect(destroyed).toEqual([img('drop').publicId, img('photo').publicId]);
  });

  it('accepts a full list of 30 items, 50 faqs and 10 project images', async () => {
    const course = await createCourse();
    const res = await patch(course._id, {
      audience: Array.from({ length: 30 }, (_, i) => `a${i}`),
      faqs: Array.from({ length: 50 }, (_, i) => ({ question: `q${i}`, answer: 'a' })),
      projects: [{ title: 'P', images: Array.from({ length: 10 }, (_, i) => img(`i${i}`)) }],
    });
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/courses/:id/extras validation (400)', () => {
  const oversizedImages = Array.from({ length: 11 }, (_, i) => img(`i${i}`));
  const cases: Array<[string, unknown]> = [
    ['an empty body', {}],
    ['an unknown field', { title: 'Hacked' }],
    ['a $-key at top level', { $set: { audience: [] } }],
    ['toolsSection that is not an object', { toolsSection: 'x' }],
    ['toolsSection null', { toolsSection: null }],
    ['toolsSection with an unknown key', { toolsSection: { tools: [], extra: 1 } }],
    ['toolsSection with a $-key', { toolsSection: { $where: '1', tools: [] } }],
    ['tools that are not ids', { toolsSection: { tools: ['abc'] } }],
    ['tools that are objects', { toolsSection: { tools: [{ $ne: null }] } }],
    [
      'too many tools',
      { toolsSection: { tools: Array.from({ length: 31 }, () => '507f1f77bcf86cd799439011') } },
    ],
    ['a tool title over 150', { toolsSection: { title: 'a'.repeat(151), tools: [] } }],
    ['a benefit without a title', { benefitsSection: { items: [{ description: 'x' }] } }],
    [
      'too many benefits',
      { benefitsSection: { items: Array.from({ length: 31 }, () => ({ title: 't' })) } },
    ],
    ['a non-string title', { benefitsSection: { items: [{ title: { $gt: '' } }] } }],
    [
      'a benefit icon from another folder',
      {
        benefitsSection: {
          items: [
            {
              title: 't',
              icon: { url: 'https://res.cloudinary.com/x/other/a', publicId: 'other/a' },
            },
          ],
        },
      },
    ],
    ['projects not a list', { projects: {} }],
    ['a project without a title', { projects: [{ description: 'x' }] }],
    ['too many projects', { projects: Array.from({ length: 31 }, () => ({ title: 't' })) }],
    ['too many project images', { projects: [{ title: 'P', images: oversizedImages }] }],
    ['a javascript: demo link', { projects: [{ title: 'P', liveDemoUrl: 'javascript:alert(1)' }] }],
    ['an ftp video link', { projects: [{ title: 'P', videoUrl: 'ftp://example.com/v' }] }],
    ['a link that is not a url', { projects: [{ title: 'P', liveDemoUrl: 'not a url' }] }],
    [
      'an image url from another host',
      {
        projects: [
          {
            title: 'P',
            images: [
              {
                url: 'https://evil.com/medhabee/course-extras/a',
                publicId: 'medhabee/course-extras/a',
              },
            ],
          },
        ],
      },
    ],
    [
      'an image url not containing its public id',
      {
        projects: [
          {
            title: 'P',
            images: [
              { url: 'https://res.cloudinary.com/x/y', publicId: 'medhabee/course-extras/a' },
            ],
          },
        ],
      },
    ],
    [
      'an image public id outside the folder',
      {
        projects: [
          {
            title: 'P',
            images: [
              {
                url: 'https://res.cloudinary.com/x/medhabee/courses/a',
                publicId: 'medhabee/courses/a',
              },
            ],
          },
        ],
      },
    ],
    [
      'an image public id with odd characters',
      {
        projects: [
          {
            title: 'P',
            images: [
              {
                url: 'https://res.cloudinary.com/x/medhabee/course-extras/a b',
                publicId: 'medhabee/course-extras/a b',
              },
            ],
          },
        ],
      },
    ],
    [
      'a project image with extra keys',
      { projects: [{ title: 'P', images: [{ ...img('a'), $x: 1 }] }] },
    ],
    ['an empty audience entry', { audience: ['ok', '  '] }],
    ['audience entry over 200', { audience: ['a'.repeat(201)] }],
    ['too many audience entries', { audience: Array.from({ length: 31 }, () => 'a') }],
    ['audience not a list', { audience: 'all' }],
    ['a story without a title', { successStories: [{ companyName: 'Acme' }] }],
    ['a story with an unknown field', { successStories: [{ title: 't', rating: 5 }] }],
    ['a faq without an answer', { faqs: [{ question: 'Q' }] }],
    ['a faq without a question', { faqs: [{ answer: 'A' }] }],
    ['too many faqs', { faqs: Array.from({ length: 51 }, () => ({ question: 'q', answer: 'a' })) }],
    ['a faq answer over 2000', { faqs: [{ question: 'q', answer: 'a'.repeat(2001) }] }],
  ];

  it.each(cases)('rejects %s and changes nothing', async (_label, body) => {
    const course = await createCourse();
    const res = await patch(course._id, body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const saved = await Course.findById(course._id).lean();
    expect(saved?.audience).toEqual([]);
    expect(saved?.faqs).toEqual([]);
    expect(saved?.projects).toEqual([]);
  });

  it('rejects tool ids that do not exist', async () => {
    const course = await createCourse();
    const real = await makeTool('Real');
    const res = await patch(course._id, {
      toolsSection: { tools: [String(real._id), missingId()] },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('One or more tools do not exist');
  });

  it('a rejected save does not delete any Cloudinary picture', async () => {
    const course = await createCourse();
    await patch(course._id, { projects: [{ title: 'P', images: [img('keep')] }] });
    cloud.destroy.mockClear();
    const res = await patch(course._id, { projects: [], audience: ['ok', ''] });
    expect(res.status).toBe(400);
    expect(cloud.destroy).not.toHaveBeenCalled();
  });

  it('answers 400 (not 500) for a null project image', async () => {
    const course = await createCourse();
    const res = await patch(course._id, { projects: [{ title: 'P', images: [null] }] });
    expect(res.status).toBe(400);
  });
  it('refuses a picture that belongs to another course (removing it there would break this one)', async () => {
    const first = await createCourse();
    const second = await createCourse();
    await patch(first._id, { projects: [{ title: 'P', images: [img('shared')] }] });
    const res = await patch(second._id, { projects: [{ title: 'Q', images: [img('shared')] }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('An image belongs to another course; upload it again');
  });

  it('refuses a picture from another Cloudinary account', async () => {
    const course = await createCourse();
    const res = await patch(course._id, {
      projects: [
        {
          title: 'P',
          images: [
            {
              url: 'https://res.cloudinary.com/someone-else/medhabee/course-extras/a',
              publicId: 'medhabee/course-extras/a',
            },
          ],
        },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('a failed Cloudinary cleanup does not fail a saved change', async () => {
    const course = await createCourse();
    await patch(course._id, { projects: [{ title: 'P', images: [img('gone')] }] });
    cloud.destroy.mockRejectedValue(new Error('Cloudinary down'));
    const res = await patch(course._id, { projects: [] });
    expect(res.status).toBe(200);
    const saved = await Course.findById(course._id).lean();
    expect(saved?.projects).toHaveLength(0);
  });
});

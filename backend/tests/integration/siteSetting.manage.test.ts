import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import app from '../../src/app';
import { SiteSetting } from '../../src/models/SiteSetting.model';
import { authCookie, bearer, createUsersForAllRoles } from '../factories';

import type { IUser } from '../../src/models/User.model';
import type { UserRole } from '../../src/types/index';

const BASE = '/api/site-settings';
let users: Record<UserRole, IUser>;
const as = (role: UserRole) => authCookie(users[role]);

beforeAll(async () => {
  users = await createUsersForAllRoles();
});
beforeEach(async () => {
  await SiteSetting.deleteMany({});
});

const EMPTY_CONTACT = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebook: '',
  youtube: '',
  linkedin: '',
  instagram: '',
};

describe('GET /api/site-settings/public', () => {
  it('returns empty defaults for guests', async () => {
    const res = await request(app).get(`${BASE}/public`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { hiddenPages: [], contact: EMPTY_CONTACT } });
  });

  it('returns what was saved', async () => {
    await request(app)
      .put(`${BASE}/pages`)
      .set('Cookie', as('Super Admin'))
      .send({ hiddenPages: ['pricing'] });
    await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ phone: '+880 1711-123456' });
    const res = await request(app).get(`${BASE}/public`);
    expect(res.body.data.hiddenPages).toEqual(['pricing']);
    expect(res.body.data.contact.phone).toBe('+880 1711-123456');
  });
});

describe('PUT /api/site-settings/pages', () => {
  it('401 for guests', async () => {
    expect((await request(app).put(`${BASE}/pages`).send({ hiddenPages: [] })).status).toBe(401);
  });

  it.each(['Admin', 'Moderator', 'Teacher', 'Student'] as UserRole[])(
    '403 for %s',
    async (role) => {
      const res = await request(app)
        .put(`${BASE}/pages`)
        .set('Cookie', as(role))
        .send({ hiddenPages: ['courses'] });
      expect(res.status).toBe(403);
      expect(await SiteSetting.countDocuments()).toBe(0);
    },
  );

  it('lets a Super Admin hide pages (Bearer header too) and removes duplicates', async () => {
    const res = await request(app)
      .put(`${BASE}/pages`)
      .set('Authorization', bearer(users['Super Admin']))
      .send({ hiddenPages: ['courses', 'teachers', 'courses'] });
    expect(res.status).toBe(200);
    expect(res.body.data.hiddenPages).toEqual(['courses', 'teachers']);
    expect((await SiteSetting.findOne())?.hiddenPages).toEqual(['courses', 'teachers']);
  });

  it('accepts every whitelisted key and an empty list (shows all again)', async () => {
    const all = [
      'courses',
      'free-courses',
      'pricing',
      'teachers',
      'practice-quiz',
      'community-hub',
    ];
    const set = await request(app)
      .put(`${BASE}/pages`)
      .set('Cookie', as('Super Admin'))
      .send({ hiddenPages: all });
    expect(set.body.data.hiddenPages).toEqual(all);
    const clear = await request(app)
      .put(`${BASE}/pages`)
      .set('Cookie', as('Super Admin'))
      .send({ hiddenPages: [] });
    expect(clear.status).toBe(200);
    expect(clear.body.data.hiddenPages).toEqual([]);
  });

  it('keeps the contact when pages change', async () => {
    await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ email: 'hi@example.com' });
    const res = await request(app)
      .put(`${BASE}/pages`)
      .set('Cookie', as('Super Admin'))
      .send({ hiddenPages: ['pricing'] });
    expect(res.body.data.contact.email).toBe('hi@example.com');
  });

  it.each([
    ['an unknown key', { hiddenPages: ['courses', 'admin'] }],
    ['a non-array', { hiddenPages: 'courses' }],
    ['a missing field', {}],
    ['an object element', { hiddenPages: [{ $ne: 1 }] }],
    ['a number element', { hiddenPages: [1] }],
  ])('400 for %s', async (_label, body) => {
    const res = await request(app).put(`${BASE}/pages`).set('Cookie', as('Super Admin')).send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/site-settings/contact', () => {
  it('401 for guests', async () => {
    expect(
      (await request(app).put(`${BASE}/contact`).send({ phone: '+8801711123456' })).status,
    ).toBe(401);
  });

  it.each(['Moderator', 'Teacher', 'Student'] as UserRole[])('403 for %s', async (role) => {
    const res = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as(role))
      .send({ phone: '+8801711123456' });
    expect(res.status).toBe(403);
  });

  it.each(['Super Admin', 'Admin'] as UserRole[])('%s can save every field', async (role) => {
    const body = {
      phone: '+8801711123456',
      whatsapp: '01711 123456',
      email: 'Info@Example.com',
      address: 'Dhaka',
      facebook: 'https://facebook.com/medhabee',
      youtube: 'https://youtube.com/@medhabee',
      linkedin: 'https://www.linkedin.com/company/medhabee',
      instagram: 'https://instagram.com/medhabee',
    };
    const res = await request(app).put(`${BASE}/contact`).set('Cookie', as(role)).send(body);
    expect(res.status).toBe(200);
    expect(res.body.data.contact).toEqual({ ...body, email: 'info@example.com' });
  });

  it('updates only the sent fields, and an empty string clears one', async () => {
    await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ phone: '+8801711123456', address: 'Dhaka' });
    const res = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ address: '  ' });
    expect(res.status).toBe(200);
    expect(res.body.data.contact).toEqual({ ...EMPTY_CONTACT, phone: '+8801711123456' });
  });

  it('everyone reads the saved social links back; links never saved stay empty', async () => {
    await request(app).put(`${BASE}/contact`).set('Cookie', as('Admin')).send({
      facebook: 'https://facebook.com/medhabee',
      instagram: '  https://instagram.com/mb  ',
    });
    for (const cookie of [undefined, as('Student')]) {
      const call = request(app).get(`${BASE}/public`);
      const res = await (cookie ? call.set('Cookie', cookie) : call);
      expect(res.status).toBe(200);
      expect(res.body.data.contact).toEqual({
        ...EMPTY_CONTACT,
        facebook: 'https://facebook.com/medhabee',
        instagram: 'https://instagram.com/mb',
      });
    }
  });

  it('accepts a 300 character social link and refuses 301', async () => {
    const link = (length: number) =>
      `https://x.com/${'a'.repeat(length - 'https://x.com/'.length)}`;
    const ok300 = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ youtube: link(300) });
    expect(ok300.status).toBe(200);
    const bad301 = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ youtube: link(301) });
    expect(bad301.status).toBe(400);
  });

  it.each(['Moderator', 'Teacher', 'Student'] as UserRole[])(
    '403 for %s changing a social link',
    async (role) => {
      const res = await request(app)
        .put(`${BASE}/contact`)
        .set('Cookie', as(role))
        .send({ facebook: 'https://facebook.com/x' });
      expect(res.status).toBe(403);
      expect(await SiteSetting.countDocuments()).toBe(0);
    },
  );

  it('401 for a guest changing a social link', async () => {
    const res = await request(app)
      .put(`${BASE}/contact`)
      .send({ facebook: 'https://facebook.com/x' });
    expect(res.status).toBe(401);
  });

  it('clears a social link with an empty string', async () => {
    await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ facebook: 'https://facebook.com/medhabee' });
    const res = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ facebook: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.contact.facebook).toBe('');
  });

  it('accepts a 300 character address', async () => {
    const res = await request(app)
      .put(`${BASE}/contact`)
      .set('Cookie', as('Admin'))
      .send({ address: 'a'.repeat(300) });
    expect(res.status).toBe(200);
  });

  it.each([
    ['empty body', {}],
    ['only unknown fields', { fax: '123' }],
    ['short phone', { phone: '12345' }],
    ['letters in phone', { phone: 'call me maybe' }],
    ['bad whatsapp', { whatsapp: '+-123456789' }],
    ['phone too long', { phone: '1'.repeat(21) }],
    ['bad email', { email: 'not-an-email' }],
    ['email too long', { email: `${'a'.repeat(250)}@example.com` }],
    ['address too long', { address: 'a'.repeat(301) }],
    ['non-string phone', { phone: 12345678 }],
    ['object email', { email: { $ne: '' } }],
    ['email with mailto parameters', { email: 'help@example.com?bcc=evil%40x.com' }],
    ['email with a comma', { email: 'a@b.com,c@d.com' }],
    ['http social link', { facebook: 'http://facebook.com/x' }],
    ['script social link', { youtube: 'javascript:alert(1)' }],
    ['not a link', { linkedin: 'medhabee' }],
    ['social link too long', { instagram: `https://instagram.com/${'a'.repeat(300)}` }],
    ['object social link', { facebook: { $ne: '' } }],
  ])('400 for %s', async (_label, body) => {
    const res = await request(app).put(`${BASE}/contact`).set('Cookie', as('Admin')).send(body);
    expect(res.status).toBe(400);
    expect(await SiteSetting.countDocuments()).toBe(0);
  });
});
